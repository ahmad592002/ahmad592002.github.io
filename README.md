# ImproFact landing page (v1)

Static, single-page build. No build step and no framework.

```
index.html            page (6 sections + insights rail)
privacy.html          privacy policy (needs legal review)
assets/css/tokens.css colours, fonts, spacing: swap the client palette here
assets/css/main.css   layout, components, motion
assets/js/config.js   webhook URL, analytics ID, contact email, calculator assumptions
assets/js/main.js     interactive components + form (progressive enhancement)
assets/img/           real logo ring (logo-mark.png, logo-mark-light.png), post graphics, OG image
```

## Run locally

Any static server, for example: `npx serve .` and then open http://localhost:3000.

## Hosting requirements

- Serve HTML, CSS, JS and SVG **gzip or brotli compressed**.
- Cache `assets/` long-term (`Cache-Control: public, max-age=31536000`), and serve `index.html` with `no-cache`.
  If you edit an asset, rename it or add `?v=2`.
- Any static host does this by default: Netlify, Vercel, Cloudflare Pages, or S3 + CloudFront.
- Measured with these settings, Lighthouse mobile scores 100 / 100 / 100 / 100: LCP 1.1 s, CLS 0.025, TBT 0 ms.

## Configuration (`assets/js/config.js`)

| Key | Purpose |
| --- | --- |
| `webhookUrl` | JSON POST target. **Empty = demo mode**: the payload goes to the console and success is simulated. |
| `webhookTimeoutMs` | 10 000 ms by default. After that, the retry and email fallback appear. |
| `analyticsId` | GA4 ID. The cookie notice and gtag load only when this is set. Events always go to `window.dataLayer`. |
| `contactEmail`, `responseTime` | Shown in the footer and in form messages. |
| `calculator.*` | ROI reduction assumptions. These are shown on screen. |

## Webhook payload

```json
{
  "full_name": "", "email": "", "company": "", "company_size": "51–200",
  "bottleneck": "process", "bottleneck_label": "Process waste", "details": "",
  "request_type": "audit | consultation",
  "calculator_result": { "hours_saved_per_month": 98, "cost_saved_per_year_usd": 35444, "approval_days_cut": 2, "inputs": {}, "assumptions": {} },
  "consent": true, "referrer": "", "page_url": "", "submitted_at": "ISO-8601",
  "utm_source": "", "utm_medium": "", "utm_campaign": ""
}
```

## Analytics events (dataLayer)

`cta_click`, `component_interaction` (storefront / pillar_tabs / before_after / workflow / calculator), `form_start`, `form_submit`, `form_error`, `generate_lead` (once per successful submit, with `request_type` and `bottleneck`).

## Still needed from ImproFact before launch

- [ ] Official logo SVG. The ring is the real artwork, cut from a post graphic (92 px PNG), and the "ImproFact" wordmark is live text. A vector file would make the ring sharper on high-resolution screens.
- [ ] Official hex palette and fonts. The current tokens were sampled from the post graphics: navy `#12285a`, grey `#7d808a`, gold `#d9a441`, with Source Serif 4 + Inter.
- [ ] Sign-off on the hero headline and subheading.
- [ ] Names and order of the method steps (currently Map → Cut → Standardise → Measure).
- [ ] Sign-off on the calculator assumptions (30% meetings cut, 2 layers, 30 min per approver, 1 day wait per layer).
- [ ] Before/after figures for 3 processes. The current figures are labelled "Illustrative".
- [ ] Workflow stage owners and SLAs. The current values are labelled illustrative.
- [ ] Contact email (`info@improfact.com` is a placeholder) and the stated response time.
- [ ] Approved success metrics, client logos and testimonials. Their blocks (`#trust-metrics`, `#trust-proof`) stay hidden until then.
- [ ] Legal review of `privacy.html`.
- [ ] Optional: direct URLs for each LinkedIn post in the insights rail (they currently link to the posts page).

## After editing any CSS, JS or image

Run `node scripts/version-assets.js`. It stamps each asset link with a content hash (`?v=…`), so browsers and CDNs fetch the new file instead of a cached copy.
