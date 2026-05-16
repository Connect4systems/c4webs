import re

import frappe
from frappe import _


_LAYOUT_FIELD_TYPES = {
    "Section Break",
    "Column Break",
    "Tab Break",
    "HTML",
    "Button",
    "Table",
    "Table MultiSelect",
    "Fold",
    "Heading",
}

_TEXT_LIKE_FIELD_TYPES = {
    "Data",
    "Small Text",
    "Text",
    "Text Editor",
    "Long Text",
    "Code",
    "Markdown Editor",
    "Read Only",
}

_BLOG_IMAGE_FIELD_CANDIDATES = (
    "image",
    "meta_image",
    "featured_image",
    "cover_image",
    "thumbnail",
)

_PARTNER_SECTION_KICKER_FIELD_CANDIDATES = (
    "partners_section_kicker",
    "partner_section_kicker",
    "partners_kicker",
    "partner_kicker",
)

_PARTNER_SECTION_TITLE_FIELD_CANDIDATES = (
    "partners_section_title",
    "partner_section_title",
    "partners_title",
    "partner_title",
)

_DEFAULT_PARTNER_SECTION_KICKER = "شركاء وكيانات نعمل معها"
_DEFAULT_PARTNER_SECTION_TITLE = "منظومة تعاون قوية تعزز سرعة التنفيذ"

_IMG_SRC_PATTERN = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.IGNORECASE)


def _clean_text(value, max_len=0):
    if value is None:
        text = ""
    else:
        text = str(value).strip()
    if max_len and len(text) > max_len:
        return text[:max_len]
    return text


def _is_placeholder(value):
    text = _clean_text(value)
    return not text or text.startswith("اختر")


def _clean_users(value):
    text = _clean_text(value, 20)
    if not text:
        return ""
    # Keep numeric characters only so the value can be saved into Int/Data fields safely.
    return "".join(char for char in text if char.isdigit())


def _normalize_web_url(value):
    text = _clean_text(value, 500)
    if not text:
        return ""

    if text.startswith(("http://", "https://", "//", "data:")):
        return text
    if text.startswith("/"):
        return text
    return f"/{text}"


def _extract_first_image_from_html(html_text):
    html_value = _clean_text(html_text, 20000)
    if not html_value:
        return ""

    match = _IMG_SRC_PATTERN.search(html_value)
    if not match:
        return ""
    return _normalize_web_url(match.group(1))


def _first_configured_value(document, fieldnames, max_len=0):
    for fieldname in fieldnames:
        value = _clean_text(document.get(fieldname), max_len)
        if value:
            return value
    return ""


def _get_partner_section_text():
    settings = frappe.get_cached_doc("Website Settings", "Website Settings")

    kicker = _first_configured_value(
        settings,
        _PARTNER_SECTION_KICKER_FIELD_CANDIDATES,
        max_len=200,
    ) or _DEFAULT_PARTNER_SECTION_KICKER

    title = _first_configured_value(
        settings,
        _PARTNER_SECTION_TITLE_FIELD_CANDIDATES,
        max_len=240,
    ) or _DEFAULT_PARTNER_SECTION_TITLE

    return {"kicker": kicker, "title": title}


def _coerce_field_value(field, raw_value):
    if not field:
        return ""
    if raw_value is None:
        return ""

    fieldtype = (field.fieldtype or "").strip()
    text = _clean_text(raw_value, 2000)
    if _is_placeholder(text):
        return ""

    if fieldtype in {"Int", "Check"}:
        normalized = "".join(char for char in text if char.isdigit() or char == "-")
        if not normalized:
            return ""
        try:
            return int(normalized)
        except (TypeError, ValueError):
            return ""

    if fieldtype in {"Float", "Currency", "Percent"}:
        normalized = text.replace(",", "")
        try:
            return float(normalized)
        except (TypeError, ValueError):
            return ""

    if fieldtype == "Link":
        options = _clean_text(getattr(field, "options", ""), 140)
        if not options:
            return text
        return text if frappe.db.exists(options, text) else ""

    return text


def _infer_required_value(fieldname, values):
    name = (fieldname or "").lower()
    if not name:
        return ""

    if "sector" in name or "industry" in name or "وصف_النشاط" in (fieldname or ""):
        return values.get("sector") or ""
    if (
        "scope" in name
        or "need" in name
        or "require" in name
        or "service" in name
        or name.endswith("_req")
        or "req" in name
    ):
        return values.get("scope") or ""
    if (
        "message" in name
        or "note" in name
        or "brief" in name
        or "challenge" in name
        or name.endswith("_inq")
        or "inq" in name
    ):
        return values.get("message") or ""
    if "user" in name or "employee" in name or "staff" in name:
        return values.get("users") or ""
    if "company" in name:
        return values.get("company") or ""
    if "phone" in name or "mobile" in name:
        return values.get("phone") or ""
    if "email" in name:
        return values.get("email") or ""
    if "source" in name:
        return "Website"
    return ""


@frappe.whitelist(allow_guest=True)
def create_website_lead():
    """Create a Lead from the public website contact form."""
    request_json = {}
    if hasattr(frappe.request, "get_json"):
        request_json = frappe.request.get_json(silent=True) or {}

    form_dict = frappe.local.form_dict or {}
    data = frappe._dict({**request_json, **form_dict})

    full_name = _clean_text(data.get("name"), 140)
    company = _clean_text(data.get("company"), 140)
    phone = _clean_text(data.get("phone"), 80)
    email = _clean_text(data.get("email"), 140)
    sector = _clean_text(data.get("sector") or data.get("وصف_النشاط") or data.get("custom_sector"), 140)
    scope = _clean_text(data.get("scope") or data.get("custom_req") or data.get("need_type"), 140)
    message = _clean_text(data.get("message") or data.get("custom_inq"), 2000)
    users = _clean_users(data.get("users") or data.get("no_of_employees") or data.get("employee_count"))
    source_page = _clean_text(data.get("source_page"), 255) or _clean_text(getattr(frappe.request, "path", ""), 255)

    if not full_name:
        frappe.throw(_("يرجى إدخال الاسم الكامل"), frappe.ValidationError)
    if not email:
        frappe.throw(_("يرجى إدخال البريد الإلكتروني"), frappe.ValidationError)
    if not phone:
        frappe.throw(_("يرجى إدخال رقم الجوال"), frappe.ValidationError)

    if not frappe.utils.validate_email_address(email, throw=False):
        frappe.throw(_("البريد الإلكتروني غير صالح"), frappe.ValidationError)

    lead_meta = frappe.get_meta("Lead")

    extra_notes = []
    if sector and "اختر" not in sector:
        extra_notes.append(f"Sector: {sector}")
    if scope and "اختر" not in scope:
        extra_notes.append(f"Need: {scope}")
    if users:
        extra_notes.append(f"Users: {users}")
    if source_page:
        extra_notes.append(f"Source Page: {source_page}")
    if message:
        extra_notes.append(f"Message: {message}")

    lead_data = {
        "doctype": "Lead",
        "lead_name": full_name,
        "company_name": company or None,
        "email_id": email,
        "mobile_no": phone,
        "status": "Lead",
    }

    source_field = lead_meta.get_field("source")
    if source_field:
        source_value = _coerce_field_value(source_field, "Website")
        if source_value != "":
            lead_data["source"] = source_value

    # Copy any matching form keys to Lead fields, including custom fields.
    for field in lead_meta.fields:
        fieldname = (field.fieldname or "").strip()
        if not fieldname or field.fieldtype in _LAYOUT_FIELD_TYPES:
            continue
        if fieldname in lead_data:
            continue

        value = _coerce_field_value(field, data.get(fieldname))
        if value != "":
            lead_data[fieldname] = value

    # Map common website keys to likely custom Lead fields.
    alias_values = {
        "sector": sector,
        "industry": sector,
        "وصف_النشاط": sector,
        "custom_sector": sector,
        "scope": scope,
        "custom_req": scope,
        "need_type": scope,
        "custom_scope": scope,
        "custom_need_type": scope,
        "message": message,
        "custom_inq": message,
        "custom_message": message,
        "users": users,
        "custom_users": users,
        "employee_count": users,
        "no_of_employees": users,
        "source_page": source_page,
        "custom_source_page": source_page,
    }
    for fieldname, value in alias_values.items():
        field = lead_meta.get_field(fieldname)
        if not field or fieldname in lead_data:
            continue
        coerced_value = _coerce_field_value(field, value)
        if coerced_value == "":
            continue
        lead_data[fieldname] = coerced_value

    notes_text = "\n".join(extra_notes)
    if notes_text:
        notes_field = lead_meta.get_field("notes")
        description_field = lead_meta.get_field("description")

        # Some Lead setups use a child table for notes; write summary text only to text-like fields.
        if notes_field and notes_field.fieldtype in _TEXT_LIKE_FIELD_TYPES:
            lead_data["notes"] = notes_text
        elif description_field and description_field.fieldtype in _TEXT_LIKE_FIELD_TYPES:
            lead_data["description"] = notes_text

    # Attempt to satisfy required custom fields from existing form values.
    inferred_values = {
        "sector": sector,
        "scope": scope,
        "message": message,
        "users": users,
        "company": company,
        "phone": phone,
        "email": email,
    }
    missing_required = []
    for field in lead_meta.fields:
        fieldname = (field.fieldname or "").strip()
        if not fieldname or not field.reqd or field.fieldtype in _LAYOUT_FIELD_TYPES:
            continue
        if lead_data.get(fieldname):
            continue
        if field.default:
            lead_data[fieldname] = field.default
            continue

        inferred = _infer_required_value(fieldname, inferred_values)
        inferred_value = _coerce_field_value(field, inferred)
        if inferred_value != "":
            lead_data[fieldname] = inferred_value
            continue

        missing_required.append(fieldname)

    if missing_required:
        frappe.throw(
            _("الرجاء استكمال الحقول الإلزامية في Lead: {0}").format(", ".join(missing_required)),
            frappe.ValidationError,
        )

    lead = frappe.get_doc(lead_data)
    lead.insert(ignore_permissions=True)
    frappe.db.commit()

    return {
        "ok": True,
        "lead_name": lead.name,
        "message": _("تم استلام طلبك بنجاح، وسنتواصل معك قريبا"),
    }


@frappe.whitelist(allow_guest=True)
def get_partner_logos(limit=60):
    """Return partner logos from published Blog Posts in category `partner`."""
    section_text = _get_partner_section_text()

    try:
        limit_value = int(limit)
    except (TypeError, ValueError):
        limit_value = 60

    limit_value = max(1, min(limit_value, 200))

    try:
        blog_meta = frappe.get_meta("Blog Post")

        fields = ["name"]
        for fieldname in ("title", "route", "content", "blog_category", "published"):
            if blog_meta.get_field(fieldname):
                fields.append(fieldname)

        available_image_fields = [
            fieldname for fieldname in _BLOG_IMAGE_FIELD_CANDIDATES if blog_meta.get_field(fieldname)
        ]
        fields.extend(available_image_fields)

        if not blog_meta.get_field("blog_category"):
            return {
                "items": [],
                "kicker": section_text["kicker"],
                "title": section_text["title"],
            }

        filters = [["blog_category", "in", ["partner", "Partner"]]]
        if blog_meta.get_field("published"):
            filters.insert(0, ["published", "=", 1])

        order_by = "published_on desc, creation desc" if blog_meta.get_field("published_on") else "creation desc"

        posts = frappe.get_all(
            "Blog Post",
            filters=filters,
            fields=fields,
            order_by=order_by,
            limit_page_length=limit_value,
            ignore_permissions=True,
        )

        if not posts:
            relaxed_filters = [["blog_category", "like", "%partner%"]]
            if blog_meta.get_field("published"):
                relaxed_filters.insert(0, ["published", "=", 1])

            posts = frappe.get_all(
                "Blog Post",
                filters=relaxed_filters,
                fields=fields,
                order_by=order_by,
                limit_page_length=limit_value,
                ignore_permissions=True,
            )
    except Exception:
        frappe.log_error(frappe.get_traceback(), "c4web.get_partner_logos")
        return {
            "items": [],
            "kicker": section_text["kicker"],
            "title": section_text["title"],
        }

    items = []
    seen_urls = set()

    for post in posts:
        logo_url = ""

        for fieldname in available_image_fields:
            logo_url = _normalize_web_url(post.get(fieldname))
            if logo_url:
                break

        if not logo_url:
            logo_url = _extract_first_image_from_html(post.get("content"))

        if not logo_url or logo_url in seen_urls:
            continue

        seen_urls.add(logo_url)

        route = _clean_text(post.get("route"), 255)
        if route and not route.startswith("/"):
            route = f"/{route}"

        items.append(
            {
                "title": _clean_text(post.get("title"), 140) or "partner",
                "route": route or "/blog/partner",
                "logo_url": logo_url,
            }
        )

    return {
        "items": items,
        "kicker": section_text["kicker"],
        "title": section_text["title"],
    }
