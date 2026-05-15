import frappe
from frappe.utils import flt, cint
from frappe.utils.pdf import get_pdf


def get_website_stock_settings():
    website_warehouse = frappe.db.get_single_value(
        "Website Settings",
        "custom_website_stock_warehouse"
    )

    show_only_available = cint(
        frappe.db.get_single_value(
            "Website Settings",
            "custom_show_only_available_stock_products"
        )
    )

    return website_warehouse, show_only_available


def get_item_stock_qty(item_code, warehouse=None):
    if warehouse:
        return flt(
            frappe.db.get_value(
                "Bin",
                {
                    "item_code": item_code,
                    "warehouse": warehouse
                },
                "actual_qty"
            )
        )

    qty = frappe.db.sql(
        """
        SELECT COALESCE(SUM(actual_qty), 0)
        FROM `tabBin`
        WHERE item_code = %s
        """,
        item_code
    )

    return flt(qty[0][0]) if qty else 0


def get_item_price(item_code):
    rate = frappe.db.sql(
        """
        SELECT price_list_rate
        FROM `tabItem Price`
        WHERE
            item_code = %s
            AND selling = 1
            AND IFNULL(price_list_rate, 0) > 0
        ORDER BY valid_from DESC, modified DESC
        LIMIT 1
        """,
        item_code
    )

    return flt(rate[0][0]) if rate else 0


@frappe.whitelist(allow_guest=True)
def sales_order_pdf(name=None, key=None):
    secret_key = frappe.conf.get("whatsapp_pdf_key")

    if not secret_key:
        frappe.throw("whatsapp_pdf_key is not configured in site_config.json")

    if key != secret_key:
        frappe.throw("Invalid key")

    if not name:
        frappe.throw("Sales Order name is required")

    if not frappe.db.exists("Sales Order", name):
        frappe.throw("Sales Order not found")

    html = frappe.get_print(
        doctype="Sales Order",
        name=name,
        print_format="Standard",
        no_letterhead=0,
    )
    pdf = get_pdf(html)

    frappe.local.response.filename = f"{name}.pdf"
    frappe.local.response.filecontent = pdf
    frappe.local.response.type = "download"


@frappe.whitelist(allow_guest=True)
def get_product_page_info(item_code=None, route=None):
    if not item_code and route:
        route = route.strip("/")
        item_code = frappe.db.get_value(
            "Website Item",
            {"route": route},
            "item_code"
        )

    if not item_code:
        return {}

    website_warehouse, show_only_available = get_website_stock_settings()

    actual_qty = get_item_stock_qty(item_code, website_warehouse)
    price_list_rate = get_item_price(item_code)

    return {
        "item_code": item_code,
        "actual_qty": actual_qty,
        "in_stock": actual_qty > 0,
        "show_only_available": show_only_available,
        "price_list_rate": price_list_rate,
        "price_display": f"{price_list_rate:,.2f} LE" if price_list_rate > 0 else ""
    }


@frappe.whitelist(allow_guest=True)
def get_related_products(item_code=None, route=None, limit=20):
    limit = int(limit or 20)

    if not item_code and route:
        route = route.strip("/")
        item_code = frappe.db.get_value(
            "Website Item",
            {"route": route},
            "item_code"
        )

    if not item_code:
        return []

    item_group = frappe.db.get_value("Item", item_code, "item_group")

    if not item_group:
        return []

    website_warehouse, show_only_available = get_website_stock_settings()

    warehouse_condition = ""
    having_condition = ""

    values = {
        "item_code": item_code,
        "item_group": item_group,
        "limit": limit,
    }

    if website_warehouse:
        warehouse_condition = "AND bin.warehouse = %(website_warehouse)s"
        values["website_warehouse"] = website_warehouse

    if show_only_available:
        having_condition = "HAVING actual_qty > 0"

    products = frappe.db.sql(
        f"""
        SELECT
            wi.item_code,
            wi.web_item_name,
            wi.route,
            wi.website_image,
            i.item_group,
            MAX(ip.price_list_rate) AS price_list_rate,
            COALESCE(SUM(bin.actual_qty), 0) AS actual_qty
        FROM `tabWebsite Item` wi
        INNER JOIN `tabItem` i ON i.name = wi.item_code
        LEFT JOIN `tabItem Price` ip
            ON ip.item_code = wi.item_code
            AND ip.price_list = 'Standard Selling'
            AND ip.selling = 1
        LEFT JOIN `tabBin` bin
            ON bin.item_code = wi.item_code
            {warehouse_condition}
        WHERE
            wi.published = 1
            AND wi.item_code != %(item_code)s
            AND i.item_group = %(item_group)s
            AND i.disabled = 0
        GROUP BY
            wi.item_code,
            wi.web_item_name,
            wi.route,
            wi.website_image,
            i.item_group
        {having_condition}
        ORDER BY wi.modified DESC
        LIMIT %(limit)s
        """,
        values,
        as_dict=True,
    )

    for product in products:
        product.price_display = ""
        if flt(product.price_list_rate) > 0:
            product.price_display = f"{flt(product.price_list_rate):,.2f} LE"

    return products

def validate_user_mobile_number(doc, method=None):
    if not doc.is_new():
        return

    if doc.name in {"Guest", "Administrator"}:
        return

    if not (doc.mobile_no or "").strip():
        doc.mobile_no = get_signup_mobile_number()

    if not (doc.mobile_no or "").strip():
        frappe.throw("Mobile Number is mandatory when creating a new user.")


def get_signup_mobile_number():
    return (
        getattr(frappe.flags, "signup_mobile_no", None)
        or
        frappe.form_dict.get("mobile_no")
        or frappe.local.form_dict.get("mobile_no")
        or frappe.request.form.get("mobile_no")
        or frappe.request.values.get("mobile_no")
        or ""
    ).strip()


def update_customer_mobile_number(email, mobile_no):
    if not email or not mobile_no:
        return set()

    customer_meta = frappe.get_meta("Customer")
    customers = set(
        frappe.get_all(
            "Customer",
            filters={"email_id": email},
            pluck="name",
        )
    )

    contact_names = frappe.get_all(
        "Contact Email",
        filters={"email_id": email},
        pluck="parent",
    )

    if contact_names:
        linked_customers = frappe.get_all(
            "Dynamic Link",
            filters={
                "parenttype": "Contact",
                "parent": ["in", contact_names],
                "link_doctype": "Customer",
            },
            pluck="link_name",
        )
        customers.update(linked_customers)

    for customer in customers:
        values = {}
        if customer_meta.has_field("mobile_no"):
            values["mobile_no"] = mobile_no
        if customer_meta.has_field("phone"):
            values["phone"] = mobile_no
        if values:
            frappe.db.set_value("Customer", customer, values, update_modified=False)

    return customers


def get_default_customer_group():
    return (
        frappe.db.get_single_value("Selling Settings", "customer_group")
        or frappe.defaults.get_global_default("customer_group")
        or frappe.db.get_value("Customer Group", {"is_group": 0}, "name")
        or "All Customer Groups"
    )


def get_default_territory():
    return (
        frappe.defaults.get_global_default("territory")
        or frappe.db.get_value("Territory", {"is_group": 0}, "name")
        or "All Territories"
    )


def ensure_signup_customer(email, full_name, mobile_no):
    if not email or not frappe.db.exists("User", email):
        return

    if update_customer_mobile_number(email, mobile_no):
        return

    customer_meta = frappe.get_meta("Customer")
    customer = frappe.new_doc("Customer")
    customer.customer_name = full_name or email

    if customer_meta.has_field("customer_type"):
        customer.customer_type = "Individual"
    if customer_meta.has_field("customer_group"):
        customer.customer_group = get_default_customer_group()
    if customer_meta.has_field("territory"):
        customer.territory = get_default_territory()
    if customer_meta.has_field("email_id"):
        customer.email_id = email
    if customer_meta.has_field("mobile_no"):
        customer.mobile_no = mobile_no
    if customer_meta.has_field("phone"):
        customer.phone = mobile_no

    customer.insert(ignore_permissions=True)


def update_new_customer_mobile_number(doc, method=None):
    if not frappe.get_meta("Customer").has_field("mobile_no"):
        return

    email = (doc.get("email_id") or "").strip()
    if not email:
        return

    mobile_no = (frappe.db.get_value("User", email, "mobile_no") or "").strip()
    if mobile_no and not (doc.get("mobile_no") or "").strip():
        frappe.db.set_value("Customer", doc.name, "mobile_no", mobile_no, update_modified=False)


@frappe.whitelist(allow_guest=True)
def sign_up_with_mobile(email=None, full_name=None, redirect_to=None, mobile_no=None):
    mobile_no = (mobile_no or get_signup_mobile_number()).strip()
    email = (email or frappe.form_dict.get("email") or "").strip()
    full_name = (full_name or frappe.form_dict.get("full_name") or "").strip()
    redirect_to = redirect_to or frappe.form_dict.get("redirect_to")

    if not mobile_no:
        frappe.throw("Mobile Number is mandatory when creating a new user.")

    frappe.flags.signup_mobile_no = mobile_no

    try:
        from frappe.core.doctype.user.user import sign_up as frappe_sign_up

        response = frappe_sign_up(email=email, full_name=full_name, redirect_to=redirect_to)
    except TypeError:
        from frappe.www.login import sign_up as frappe_sign_up

        response = frappe_sign_up()

    if mobile_no and email and frappe.db.exists("User", email):
        frappe.db.set_value("User", email, "mobile_no", mobile_no, update_modified=False)
        ensure_signup_customer(email, full_name, mobile_no)

    return response
