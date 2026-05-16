import frappe


def execute():
    website_settings = frappe.get_single("Website Settings")

    if not getattr(website_settings, "item_fields", None):
        return

    original_count = len(website_settings.item_fields)
    website_settings.item_fields = [
        row for row in website_settings.item_fields
        if row.fieldname != "item_group"
    ]

    if len(website_settings.item_fields) == original_count:
        return

    website_settings.save(ignore_permissions=True)
