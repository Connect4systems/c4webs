import frappe
import requests
from frappe.utils import formatdate
from frappe.utils.pdf import get_pdf


def clean_egypt_mobile(mobile):
    mobile = (mobile or "").replace("+", "").replace(" ", "").replace("-", "").replace("(", "").replace(")", "")

    if mobile.startswith("20"):
        return mobile

    if mobile.startswith("0"):
        return "2" + mobile

    return "20" + mobile


def get_customer_contact(customer):
    contact_name = frappe.db.get_value(
        "Dynamic Link",
        {
            "link_doctype": "Customer",
            "link_name": customer,
            "parenttype": "Contact",
        },
        "parent",
    )

    if not contact_name:
        return None, None, None

    contact = frappe.get_doc("Contact", contact_name)
    mobile = contact.mobile_no or contact.phone or ""
    contact_person = contact.first_name or contact.full_name or ""

    return contact_name, contact_person, mobile


def send_sales_order_pdf(doc, method=None):
    token = frappe.conf.get("wapilot_token")
    instance_id = frappe.conf.get("wapilot_instance_id") or "4027"

    if not token:
        frappe.log_error("wapilot_token missing in site_config.json", "WhatsApp Sales Order PDF")
        return

    contact_name, contact_person, mobile = get_customer_contact(doc.customer)

    if not mobile:
        frappe.log_error(f"No mobile found for customer {doc.customer}", "WhatsApp Sales Order PDF")
        return

    whatsapp_no = clean_egypt_mobile(mobile)
    chat_id = f"{whatsapp_no}@c.us"

    caption = (
        f"السيد {contact_person or doc.customer_name or doc.customer}\n\n"
        f"نشكركم على طلبكم منتجاتنا بتاريخ {formatdate(doc.transaction_date, 'dd-MM-yyyy')}.\n\n"
        f"رقم أمر البيع: {doc.name}\n\n"
        f"إجمالي الطلب: {doc.grand_total} {doc.currency}\n\n"
        f"مع خالص التحية\n"
        f"Connect 4 Systems"
    )

    html = frappe.get_print(
        doctype="Sales Order",
        name=doc.name,
        print_format="Standard",
        no_letterhead=0,
    )

    pdf_content = get_pdf(html)
    filename = f"Sales Order {doc.name}.pdf"
    url = f"https://api.wapilot.net/api/v2/instance{instance_id}/send-file"

    headers = {
        "token": token,
    }
    data = {
        "chat_id": chat_id,
        "caption": caption,
    }
    files = {
        "media": (filename, pdf_content, "application/pdf"),
    }

    response = requests.post(url, headers=headers, data=data, files=files, timeout=60)

    if response.status_code >= 400:
        frappe.log_error(
            f"Status: {response.status_code}\nResponse: {response.text}\nChat ID: {chat_id}",
            "WhatsApp Sales Order PDF Failed",
        )
    else:
        frappe.log_error(
            f"Sent successfully\nResponse: {response.text}\nChat ID: {chat_id}",
            "WhatsApp Sales Order PDF Sent",
        )
