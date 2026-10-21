# Skillbuffet SEO, AEO and GEO implementation

Implemented from the owner's `skillbuffet-seo-guide.md` on 21 October 2026. The guide is implementation reference material, not a marketplace submission. No skill, approval, rating or download record was created by this work.

## Implemented in code

| Guide areas                                            | Implementation                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Brand, titles, descriptions, canonical and social tags | Shared `lib/seo/site.ts`; unique public-page metadata, category/specialty and approved skill metadata; clean absolute canonicals without filters; descriptions capped at a word boundary. Titles prioritize meaning over mechanical character padding.                                                                                                                                           |
| Heading and semantic structure                         | One page H1; submitted Markdown H1/H2 renders below the SKILL.md H2; skill sidebar sections use H2; descriptive headings; skip-to-content link.                                                                                                                                                                                                                                                  |
| Answer-first copy and internal linking                 | Clear homepage definition; visible home/category/skill FAQs; About and How it works pages; category/specialty routes; footer discovery links; real related skills, with no filler listings.                                                                                                                                                                                                      |
| Structured data                                        | Organization, WebSite, WebPage and matching visible BreadcrumbList graph; FAQPage only for visible matching questions; organization-authored TechArticle docs; SoftwareApplication for real approved skills, genuine recorded aggregate ratings only. No fabricated offers, social profiles, author pages, reviews or certifications. HTML-significant characters escaped in serialized JSON-LD. |
| Social images and app identity                         | Whitelisted route-based 1200 × 630 PNG social cards, per-page text, SVG favicon, 180/192/512 PNG icons and manifest. No stock image dependency.                                                                                                                                                                                                                                                  |
| Sitemap                                                | Dynamic `/sitemap.xml` and `/sitemap-index.xml`; real approved skills only; categories/specialties included only when a real approved listing exists. Private, utility, demo and empty category pages excluded. No invented build-time lastmod. A database outage fails sitemap generation rather than serving an incomplete public sitemap.                                                     |
| Crawling                                               | Preview/local are noindex by metadata and response header, disallowed in robots, with empty sitemaps. Production public indexing requires explicit configuration below. Private paths retain authentication and noindex. Robots is not access control.                                                                                                                                           |
| AI discovery                                           | `/llms.txt` and `/llms-full.txt`, generated from real route/taxonomy/documentation sources. No private submissions included. These are optional discovery aids, not citation or ranking guarantees.                                                                                                                                                                                              |
| Error and utility pages                                | Noindex auth, admin, dashboard, publish and search. `/search?q=` supports a real query with clean canonical. Existing Next notFound returns a real 404, with search and helpful category links.                                                                                                                                                                                                  |
| Security and rendering                                 | Server-rendered public content and metadata; request-scoped catalog memoization avoids repeated loads. HTTPS on Vercel; nosniff, referrer, permissions, CSP and HSTS headers. CSP permits inline script/style for current Next hydration; it is not a nonce-based strict policy.                                                                                                                 |
| Design and accessibility                               | Approved dark design retained, responsive controls, descriptive labels and visible focus; no new tracking scripts or consent assumptions.                                                                                                                                                                                                                                                        |

## Deliberate adaptations

- Preserve the established `/skills/[slug]` and `/skills/categories/[slug]` routes and 19-category taxonomy. Renaming live routes to the guide's illustrative hierarchy would break existing links and require taxonomy/data migration. Specialties now have real crawlable pages below each category.
- Preserve slashless canonicals with Next's permanent 308 slash normalization. A 308 is a permanent redirect that preserves HTTP methods; a sitewide slash migration is unnecessary and could disrupt API/auth flows. `/for-developers` permanently redirects to the existing publishing documentation.
- The structured-data script is server-rendered in the page body. Google supports JSON-LD in either head or body. Markup describes visible content and is not a way to guarantee rich results.
- FAQ and HowTo markup do not guarantee a Google search enhancement or AI citation. Only visible FAQs are described, and no HowTo-rich-result claim is made.
- Empty categories/specialties stay useful for visitors and contributors, but remain noindex until real approved skills exist.
- Sample review examples remain labeled and visible only outside the indexable production configuration. They never enter review schema or live metrics.
- Do not invent tested example outputs, creator credentials, team photos, business address, price, testimonials, statistics or review dates. Skill pages display declared inputs/outputs with an explicit distinction from tested examples. Creators must supply genuine task examples and limitations; the admin must review them.
- No blog, pricing, careers, press, language variants or placeholder author pages were manufactured. Add these when real content or functionality exists.

## REQUIRED NOW before public indexing

1. Confirm the owned final HTTPS domain and connect it to the Vercel Production project. Configure the alternate-host redirect in the domain settings. Do not point canonicals at the guide's example `www.skillbuffet.com` without verifying ownership.
2. In **Production only**, set `NEXT_PUBLIC_SITE_URL` to that exact origin and `SEO_INDEXING_ENABLED=true`, then deploy/promote the reviewed release. Preview always remains non-indexable even if the flag is copied.
3. Confirm legal entity/jurisdiction and an owner-approved private contact. Complete Privacy/Terms review and human editorial review of all public copy.
4. Supply genuine skill examples, declared inputs/outputs and limitations. Approve only reviewed versions. Do not approve a pending submission just to fill a category.
5. Verify the domain in Google Search Console and Bing Webmaster Tools. Verification metadata is ready for `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION`. Submit `/sitemap-index.xml` in both accounts after launch.
6. Validate one real page per template with Schema Markup Validator and Google's supported Rich Results Test. No external validator result is claimed by the code change.
7. Measure Lighthouse/PageSpeed on the launch domain and real-user Core Web Vitals when sufficient traffic exists. Targets: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at the 75th percentile. Responsive checks and a successful build alone do not prove these targets.
8. Choose analytics ownership and a privacy/consent model before installing GA4 or another vendor. No analytics account, consent decision or ID was supplied, and no unapproved third-party tracking has been installed.

## Measurement plan

| Outcome                  | Measure                                                                | Source                                                 |
| ------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| Organic discovery        | Indexed canonical pages, query impressions/clicks and branded searches | Search Console / Bing                                  |
| Useful catalog discovery | Category, search and detail views → successful download response       | Chosen analytics plus existing server download records |
| Creator activation       | Submission started → saved pending → approved                          | Chosen analytics plus submission/admin audit records   |
| AI discovery             | AI referral source; date/query/engine/domain citation observation      | Chosen analytics and manual monthly citation log       |
| Quality                  | Download-eligible ratings, correction requests and security reports    | Existing community/admin records                       |

Do not send skill contents, email addresses, search query text or authentication details as analytics event properties. Suggested event names: `category_view`, `catalog_search`, `skill_view`, `download_requested`, `submission_started`, `submission_saved`, `sign_up_completed`. These are an implementation plan, not a claim that a new tracker is recording events. Existing dashboard operational examples remain illustrative.

## Maintenance

Weekly: check indexing/errors. Monthly: crawl links, metadata, schema and performance; log AI citation observations by query/date/engine. Quarterly: review useful content and real examples. Per release: update dates only when content changes, check noindex/canonical decisions, verify sitemap excludes private data. No recurring automation was created.

## Sources checked

- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features): ordinary SEO foundations apply; there is no special AI schema or guaranteed inclusion.
- [Google: canonical URL consolidation](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
- [Google: structured data guidance](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data).
- Installed Next.js 16.3.8 metadata, robots, sitemap, ImageResponse, headers and trailingSlash documentation.
