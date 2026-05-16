# Connect4Systems Redesign Backlog (Arabic RTL)

## Scope Confirmed
- Website audited from live sitemap and key page samples.
- Total URLs in sitemap: `128`.
- URL split: `45` non-blog pages and `83` blog pages.
- Current stack indicators: Frappe/ERPNext website assets.

## Priority Findings To Address First
- Homepage markup is not fully Arabic-RTL semantic (`lang`/`dir` consistency issue).
- Broken link detected: `/lms` returns `404`.
- Broken link detected: `/الدعج` returns `404`.
- Multiple malformed blog slugs include encoded style/code fragments.

## Template System For Full Rollout
1. `Template A` Home (`prototype/index.html`)
- Target URLs: `/`, `/home`, `/index-ar`, `/index-en` (language strategy required).

2. `Template B` Solution Detail (`prototype/solution-template.html`)
- Target URLs: `/trade`, `/retail-system`, `/crm`, `/factory`, `/stock`, `/sales`, `/hr`, `/attendance`, `/leave-management`, `/expense-management`, `/performance-management`, `/salary-payouts`, `/tax-%26-benefits`, `/recruitment`, `/Account_system`, `/construction`, `/ship`, `/web-development`.

3. `Template C` Product/Shop (`prototype/catalog.html`)
- Target URLs: `/all-products`, `/shop-by-category`, `/%D8%A7%D9%84%D9%85%D9%86%D8%AA%D8%AC%D8%A7%D8%AA`.

4. `Template D` Corporate (`prototype/about.html`, `prototype/contact.html`)
- Target URLs: `/about`, `/contact`, `/jobs`, `/register`, `/login`, `/cart`.

5. `Template E` Blog Category (`prototype/blog-list.html`)
- Target URLs: `/blog/general-blog`, `/blog/partner`, `/blog/artical`, and all category index pages.

6. `Template F` Blog Post (`prototype/blog-post.html`)
- Target URLs: every `/blog/**` detail page.

## URL Governance And Redirect Backlog
1. Redirect legacy/test pages to canonical targets
- Candidate sources: `/retailtest`, `/testabout`, `/testregister`, `/test`, `/hr2`, `/retais-erp`, `/rana`, `/pages/PageEN`, `/pages/PageAR`, `/pages/my-page-6487`, `/project/PageAR`, `/system`, `/system2`, `/sub`, `/int`, `/c4`, `/connect`.
- Example target rules:
  - test/about style pages -> `/about` or `/contact`
  - legacy home pages -> `/`
  - duplicate solution pages -> nearest active solution URL

2. Fix broken internal links
- Replace all `/lms` references with correct training URL (or hide until available).
- Replace `/الدعج` with valid consultation/support page URL.

3. Normalize malformed blog slugs
- Create clean canonical slugs for malformed URLs.
- Add `301` redirect from old malformed URLs to clean targets.

## Content And SEO Backlog
1. Enforce page semantics
- Arabic pages: `lang="ar" dir="rtl"`.
- English pages: `lang="en" dir="ltr"`.

2. Metadata consistency
- Unique `title`, `meta description`, canonical URL, Open Graph for every template.

3. Heading and body cleanup
- Remove duplicated/empty headings.
- Rewrite CTA labels consistently in Arabic.

4. Internal linking
- Link solutions to related blog categories and case studies.

## UX And Accessibility Backlog
1. Keyboard and focus
- Ensure visible focus style for links, tabs, buttons, and form controls.

2. Contrast and readability
- Validate color contrast for primary/secondary text and CTA states.

3. Form usability
- Clear labels, error states, and mobile-friendly spacing.

4. Responsive QA
- Validate layout on mobile, tablet, and desktop.

## Execution Sprints
1. Sprint 1: Design foundation + homepage + header/footer navigation.
2. Sprint 2: Solution templates + product/shop templates.
3. Sprint 3: Blog category + blog post templates.
4. Sprint 4: Corporate pages + forms + CTA optimization.
5. Sprint 5: Redirect map + SEO + accessibility + final QA.

## Acceptance Criteria
- Arabic pages render correctly in RTL without layout breakage.
- Navigation and footer links resolve to valid pages.
- No known malformed URL is left without canonical redirect.
- Core templates share one reusable design system.
- Mobile usability passes on key pages.
