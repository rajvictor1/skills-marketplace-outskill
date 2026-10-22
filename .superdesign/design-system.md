# Skillbuffet shared light and dark design system

The owner approved the existing colorful dashboard and requested its colors, controls and typography across all website pages. This implementation rollout preserves page layouts, dashboard sections and application behavior. It supersedes the earlier ivory marketplace direction and the unimplemented compact creator-dashboard draft.

## Shared tokens

- Canvas #101522; cards/popovers #1a2132; sidebar/header #151c2b.
- Text #eef0f7; supporting text #abb5ca; borders #30394e; input borders #414b65.
- Primary action #6958ea, hover #7969f1, white label; 44px minimum height, 12px radius, consistent alignment and visible keyboard focus. Shared Button and native primary actions use cta-primary; brand-button follows the same style.
- Links/focus violet #b8adff. Teal #7dd3b2 for successful or approved states; amber #f3bf72 for attention; pink #fb8999 for failures/rejection.
- Category surfaces violet #25243b, teal #193334, peach #352b2c and blue #1c2e46 with matching light accents. No opaque white or pastel page/card surfaces.
- Geist Sans and Geist Mono, compact readable forms, main page headings 28–40px, dashboard 24–28px. Home hero retains its larger display scale.
- Existing 80rem content widths, responsive gutters and mobile navigation. Forms/actions wrap at narrow widths. Long prose and code remain readable on dark surfaces. Honor reduced motion.

## Dashboard reference

Preserve its four KPI cards, Agent activity / Top skills and creator pulse / activity panels. KPI cards have stable color accents, gradient-filled sparklines and endpoint markers. Runs uses violet/blue/teal with semantic amber/pink status segments; Outcomes teal/amber/pink; Cost peach/gold; Latency blue/cyan. Data is prominently illustrative; real approved catalog counts are separate.

## Product flows and evidence

Submit → scan → private admin review → approve and publish / request changes / reject. An approved version remains stable while an update is reviewed. No change to authentication, authorization, scanning, APIs or database schema as part of the visual rollout. Keep synthetic data/reviews labeled illustrative, preserve upstream MIT credit, and never invent adoption or security claims.

Applies to public pages, catalog/categories, skills, auth, publishing, creator workspace, admin, docs/policies, errors/loading and all shared controls.

## Light mode extension

The owner requested a header toggle with light/dark modes and persistence. Dark remains the default. Light uses ivory #f6f7fb canvas, white cards, slate #20263b text, violet #5b46c5 links and #604bd6 actions. Category surfaces retain violet, teal, peach and blue hues with deeper ink colors. Dashboard charts and KPI accents keep their multicolor meaning with stronger light-mode contrast. All pages inherit the chosen palette, including admin, auth, code, docs and native controls. Primary action labels remain white. Theme choice is stored locally as `skillbuffet-theme` and applies before hydration through the existing next-themes dependency. No layout redesign, catalog mutation or permission change is part of this extension.

## FAQ alignment

Use the owner's approved Devtron reference pattern for every existing FAQ section: one full-width column with thin row dividers, question icon at left, question text aligned consistently, and a plus that becomes a close icon when expanded. The first answer starts open; opening another closes it. Use native keyboard-operable details/summary so answers remain in server-rendered HTML and match FAQ structured data. Preserve Skillbuffet typography, light/dark tokens and reduced-motion support. No individual FAQ cards or two-column boxes.
