# c4web

Full Arabic RTL redesign for `connect4systems.com` as an installable Frappe app.

This repository now contains the **Phase 2 full version**:
- Professional interactive frontend
- Rewritten Arabic content
- Sector pages for trade, retail, CRM, factory, and HR
- AI-first brand positioning (`80%` AI-enabled team workflow)
- Legacy URL route mapping for key old pages

## App Structure

- `c4web/public/css/style.css`: Shared design system (RTL, responsive, interactive)
- `c4web/public/js/app.js`: Shared behavior (menu, reveal, counters, tabs, filters, accordion)
- `c4web/www/index-modern.html`: New homepage
- `c4web/www/solution-template-modern.html`: Solutions hub
- `c4web/www/trade-modern.html`: Trade sector page
- `c4web/www/retail-system-modern.html`: Retail sector page
- `c4web/www/crm-modern.html`: CRM sector page
- `c4web/www/factory-modern.html`: Factory sector page
- `c4web/www/hr-modern.html`: HR sector page
- `c4web/www/catalog-modern.html`: Packages + full verified media gallery
- `c4web/www/blog-list-modern.html`: Blog listing with filters
- `c4web/www/blog-post-modern.html`: Featured article page
- `c4web/www/about-modern.html`: Company profile page
- `c4web/www/contact-modern.html`: Conversion-focused contact page
- `c4web/hooks.py`: App metadata + route rules from legacy URLs to new pages

## Planning And Inventory Docs

- `docs/sitemap-links.txt`: sitemap export
- `docs/redirect-seed.csv`: redirect seed map
- `docs/image-inventory-verified.txt`: verified image URLs used in the redesign

## Bench Install

```bash
cd ~/frappe-bench

# If needed, remove old app clone first
rm -rf apps/c4web

bench get-app https://github.com/Connect4systems/c4web
bench --site <your-site-name> install-app c4web
bench --site <your-site-name> migrate
bench build
bench clear-cache
bench --site <your-site-name> clear-website-cache
bench restart
```

## Development Notes

- All pages are authored with `lang="ar" dir="rtl"`.
- Legacy links like `/home`, `/all-products`, `/retais-erp`, `/hr2`, and key `/blog/*` category routes are mapped in `c4web/hooks.py`.
- The catalog page includes the full verified image set to satisfy the full-asset usage requirement.
