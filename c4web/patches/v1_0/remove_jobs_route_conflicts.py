import frappe


def _table_exists(table_name: str) -> bool:
    try:
        return bool(frappe.db.table_exists(table_name))
    except Exception:
        return False


def _delete_redirect_docs() -> int:
    if not _table_exists("Website Route Redirect"):
        return 0

    deleted = 0
    columns = set(frappe.db.get_table_columns("Website Route Redirect") or [])
    source_fields = [field for field in ("source", "source_path", "route") if field in columns]

    if not source_fields:
        return 0

    for field in source_fields:
        names = frappe.get_all("Website Route Redirect", filters={field: "/jobs"}, pluck="name")
        for name in names:
            # Keep /jobs free for HRMS Job Portal.
            frappe.delete_doc(
                "Website Route Redirect",
                name,
                force=True,
                ignore_permissions=True,
                ignore_missing=True,
            )
            deleted += 1

    return deleted


def execute():
    _delete_redirect_docs()
    frappe.clear_cache()
