// Builds the multi-page site from content/*.json.
//   node scripts/build-site.js        (then: node scripts/version-assets.js)
// Outputs: services.html, services/*.html, how-we-work.html, insights.html,
// insights/*.html, about.html, contact.html, sitemap.xml, robots.txt — and
// refreshes the shared header + footer inside index.html and privacy.html.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); };
const site = JSON.parse(read('content/site.json'));
const articles = JSON.parse(read('content/articles.json'));
const BASE = 'https://www.improfact.com/';
const esc = s => String(s == null ? '' : s).replace(/&(?!amp;|lt;|gt;|quot;|#\d+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = s => esc(s).replace(/"/g, '&quot;');
const icon = (id, cls = 'ic') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;

// ---------- shared pieces taken from index.html (single source) ----------
let indexHtml = read('index.html');
const sprite = indexHtml.slice(indexHtml.indexOf('<!-- Icon sprite -->'), indexHtml.indexOf('</svg>', indexHtml.indexOf('<!-- Icon sprite -->')) + 6);
const contactSection = (() => { const s = indexHtml.indexOf('<section class="section contact"'); return indexHtml.slice(s, indexHtml.indexOf('</section>', s) + 10); })();

// ---------- images ----------
const IMG = { 1: 'post-commerce', 2: 'post-addition-subtraction', 3: 'post-social-media', 4: 'post-contract-review', 5: 'post-conflict',
  7: 'post-org-behavior', 11: 'post-sales-rewards', 12: 'post-remove-excess', 18: 'post-data', 19: 'post-two-minutes', 20: 'post-direction',
  21: 'post-value-proposition', 22: 'post-go-to-market', 23: 'post-pricing', 24: 'post-kpi-dashboard', 25: 'post-churn', 26: 'post-revenue-model',
  27: 'post-30-60-90', 28: 'post-rebranding', 29: 'post-growth-levers', 30: 'post-digital-owner',
  // branded covers made for the text-only posts
  6: 'post-improve-performance', 8: 'post-money-or-value', 9: 'post-spot-the-mistake', 10: 'post-clarity-problem', 13: 'post-workplace-gossip',
  14: 'post-authority', 15: 'post-loyalty-belonging', 16: 'post-budget-vs-business-plan', 17: 'post-open-workspaces' };
function jpegSize(file) { // width/height from the JPEG SOF marker (avoids layout shift)
  const b = fs.readFileSync(path.join(ROOT, file)); let i = 2;
  while (i < b.length) { const m = b[i + 1], len = b.readUInt16BE(i + 2); if (m >= 0xC0 && m <= 0xC3) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }; i += 2 + len; }
  return { w: 800, h: 800 };
}
function img(name, root, alt, { sizes = '(min-width: 1024px) 400px, 100vw', lazy = true, cls = '' } = {}) {
  const { w, h } = jpegSize(`assets/img/${name}.jpg`);
  return `<img${cls ? ` class="${cls}"` : ''} src="${root}assets/img/${name}.jpg" srcset="${root}assets/img/${name}-400.jpg 400w, ${root}assets/img/${name}.jpg 800w" sizes="${sizes}" width="${w}" height="${h}"${lazy ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async" alt="${attr(alt)}">`;
}

// ---------- services ----------
const SVC_ICON = ['i-sitemap', 'i-gear', 'i-growth', 'i-team', 'i-shield'];
const services = site.services.map((s, i) => ({ ...s, icon: SVC_ICON[i], n: i + 1 }));
const svcUrl = (s, root) => `${root}services/${s.slug}.html`;
// LinkedIn: link to each original post
const liUrl = a => `https://www.linkedin.com/feed/update/${a.linkedin}/`;
const artUrl = (a, root) => `${root}insights/${a.slug}.html`;
const byN = n => articles.find(a => a.n === n);

// ---------- header / footer ----------
const NAV = [['services.html', 'Services', 'services'], ['how-we-work.html', 'How we work', 'how'], ['insights.html', 'Insights', 'insights'], ['about.html', 'About', 'about'], ['contact.html', 'Contact', 'contact']];
function header(root, active, home = false) {
  const cta = home ? `href="#contact" data-request="audit"` : `href="${root}contact.html?request=audit"`;
  return `<!-- site:header -->
  <header class="site-header" id="top">
    <div class="container header-inner">
      <a class="brand" href="${root}index.html" aria-label="ImproFact: Where Improvement meets Excellence (home)">
        <svg class="brand-mark" aria-hidden="true" focusable="false"><use href="#logo-mark"/></svg>
        <span class="brand-text">
          <svg class="brand-word" aria-hidden="true" focusable="false"><use href="#logo-word"/></svg>
        </span>
      </a>
      <nav class="site-nav" id="site-nav" aria-label="Primary">
${NAV.map(([href, label, key]) => `        <a href="${root}${href}"${key === active ? ' aria-current="page"' : ''}>${label}</a>`).join('\n')}
        <a class="btn btn-primary nav-cta" ${cta}>Schedule an Operational Audit</a>
      </nav>
      <a class="btn btn-primary btn-sm header-cta" ${cta} data-track="cta_header">
        <span class="lg-only">Schedule an Operational Audit</span><span class="sm-only">Book an audit</span>
      </a>
      <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">${icon('i-menu')}</button>
    </div>
  </header>
  <!-- /site:header -->`;
}
function footer(root) {
  return `<!-- site:footer -->
  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <a class="brand brand-light" href="${root}index.html" aria-label="ImproFact: Where Improvement meets Excellence (home)">
          <svg class="brand-mark" aria-hidden="true" focusable="false"><use href="#logo-mark"/></svg>
          <span class="brand-text">
            <svg class="brand-word" aria-hidden="true" focusable="false"><use href="#logo-word"/></svg>
          </span>
        </a>
        <p class="footer-about">We help organizations build better systems, stronger processes and high-performing teams.</p>
        <ul class="footer-meta">
          <li>${icon('i-pin')}Tripoli, North Lebanon</li>
          <li>${icon('i-globe')}Global remote consulting</li>
        </ul>
      </div>
      <div>
        <h2 class="footer-h">Services</h2>
        <ul class="footer-links">
${services.map(s => `          <li><a href="${svcUrl(s, root)}">${esc(s.name)}</a></li>`).join('\n')}
        </ul>
      </div>
      <div>
        <h2 class="footer-h">Company</h2>
        <ul class="footer-links">
          <li><a href="${root}how-we-work.html">How we work</a></li>
          <li><a href="${root}insights.html">Insights</a></li>
          <li><a href="${root}about.html">About ImproFact</a></li>
          <li><a href="${root}contact.html">Contact</a></li>
          <li><a href="${root}privacy.html">Privacy policy</a></li>
        </ul>
      </div>
      <div>
        <h2 class="footer-h">Get in touch</h2>
        <ul class="footer-links">
          <li><a href="https://wa.me/96179306690" target="_blank" rel="noopener" aria-label="Chat with ImproFact on WhatsApp: +961 79 306 690" data-track="footer_whatsapp">${icon('i-whatsapp')}<span>+961 79 306 690</span></a></li>
          <li><a href="mailto:mtaleb85@gmail.com" data-config-mail="contactEmail" data-track="footer_email">${icon('i-mail')}<span data-config="contactEmail">mtaleb85@gmail.com</span></a></li>
          <li><a href="https://www.linkedin.com/company/improfact/" target="_blank" rel="noopener" data-config-href="linkedinUrl" data-track="footer_linkedin">${icon('i-linkedin')}LinkedIn</a></li>
        </ul>
        <a class="btn btn-accent btn-sm" href="${root}contact.html?request=audit">Book an audit</a>
      </div>
    </div>
    <div class="container footer-base">
      <p>© <span id="year">2026</span> ImproFact. All rights reserved.</p>
    </div>
  </footer>
  <!-- /site:footer -->`;
}
const cookie = `<div class="cookie" id="cookie" role="region" aria-label="Cookie notice" hidden>
    <p>We use analytics cookies to understand how this page is used. <a href="ROOTprivacy.html">Privacy policy</a></p>
    <div class="cookie-actions">
      <button type="button" class="btn btn-ghost btn-sm" data-consent="no">Decline</button>
      <button type="button" class="btn btn-primary btn-sm" data-consent="yes">Accept</button>
    </div>
  </div>`;

function layout({ file, title, description, active, body, image = 'og-image', schema, lang = 'en', dir }) {
  const root = '../'.repeat(file.split('/').length - 1);
  const url = BASE + file.replace(/index\.html$/, '');
  const ld = schema ? `\n  <script type="application/ld+json">${JSON.stringify(schema)}</script>` : '';
  return `<!doctype html>
<html lang="${lang}"${dir ? ` dir="${dir}"` : ''}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${attr(description)}">
  <link rel="canonical" href="${url}">
  <meta name="theme-color" content="#062547">
  <meta property="og:type" content="${file.startsWith('insights/') ? 'article' : 'website'}">
  <meta property="og:site_name" content="ImproFact">
  <meta property="og:title" content="${attr(title)}">
  <meta property="og:description" content="${attr(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${BASE}assets/img/${image}.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="${root}assets/img/logo-mark.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="${root}assets/img/logo-200.jpg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap"></noscript>
  <link rel="stylesheet" href="${root}assets/css/tokens.css">
  <link rel="stylesheet" href="${root}assets/css/main.css">
  <script>document.documentElement.classList.add('js');</script>${ld}
</head>
<body>
  ${sprite}

  <a class="skip-link" href="#main">Skip to content</a>

  ${header(root, active)}

  <main id="main">
${body(root)}
  </main>

  ${footer(root)}

  ${cookie.replace('ROOT', root)}

  <script src="${root}assets/js/config.js" defer></script>
  <script src="${root}assets/js/main.js" defer></script>
</body>
</html>
`;
}

// ---------- reusable blocks ----------
const crumbs = (root, items) => `<nav aria-label="Breadcrumb"><ol class="breadcrumb"><li><a href="${root}index.html">Home</a></li>${items.map(([href, label]) => href ? `<li><a href="${root}${href}">${esc(label)}</a></li>` : `<li aria-current="page">${esc(label)}</li>`).join('')}</ol></nav>`;
const ctaBand = (root, title = 'Ready to improve from the inside out?', text = 'Start with a focused operational audit. No obligation, and a clear picture of where to begin.') => `
    <section class="cta-band" aria-label="Get started">
      <div class="container">
        <div>
          <h2>${esc(title)}</h2>
          <p>${esc(text)}</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-accent btn-lg" href="${root}contact.html?request=audit">Schedule an Operational Audit</a>
          <a class="btn btn-light btn-lg" href="${root}contact.html?request=consultation">Request a Consultation</a>
        </div>
      </div>
    </section>`;
const postCard = (a, root, eager = false) => `<article class="card post-card" data-category="${attr(a.category)}">
            <div class="post-card-img${IMG[a.n] ? '' : ' is-text'}"${a.lang === 'ar' ? ' dir="rtl" lang="ar"' : ''}>${IMG[a.n] ? img(IMG[a.n], root, '', { lazy: !eager, sizes: '(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw' }) : esc(a.title)}</div>
            <div class="post-card-body"${a.lang === 'ar' ? ' dir="rtl" lang="ar"' : ''}>
              <span class="tag">${esc(a.category)}</span>
              <h3>${esc(a.title)}</h3>
              <p>${esc(a.summary)}</p>
              <a class="card-link" href="${artUrl(a, root)}">${a.lang === 'ar' ? 'اقرأ المقال' : 'Read the article'}<span class="sr-only">: ${esc(a.title)}</span> ${icon('i-arrow')}</a>
            </div>
          </article>`;
function renderBlocks(blocks) {
  return blocks.map(b => {
    if (b.type === 'h') return `<h2>${esc(b.text)}</h2>`;
    if (b.type === 'ul' || b.type === 'ol') return `<${b.type}>${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</${b.type}>`;
    if (b.type === 'flow') return `<ol class="flow" aria-label="Process flow">${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ol>`;
    return `<p>${esc(b.text)}</p>`;
  }).join('\n            ');
}
const listItems = (items, ic) => items.map(t => `<li>${icon(ic)}<span>${esc(t)}</span></li>`).join('\n              ');

// =================================================================
// PAGES
// =================================================================
const pages = [];

// ---------- services.html ----------
pages.push(['services.html', layout({
  file: 'services.html', active: 'services',
  title: 'Services | ImproFact: SOPs, Workflows, Process Improvement, Training, Quality',
  description: 'ImproFact services: SOP development, workflow design, business process improvement, training & development, and quality & excellence.',
  body: root => `
    <section class="page-hero">
      <div class="container">
        ${crumbs(root, [[null, 'Services']])}
        <p class="eyebrow">Services</p>
        <h1 class="page-title">Better processes. Stronger teams. Sustainable growth.</h1>
        <p class="lead">We help organizations build better systems, stronger processes and high-performing teams. Every engagement combines these five services to fix the business behind the screen.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="svc-rows">
${services.map(s => `          <article class="svc-row" id="${s.slug}">
            <span class="svc-ic svc-ic-${s.n}">${icon(s.icon)}</span>
            <div>
              <h2>${esc(s.name)}</h2>
              <p class="summary">${esc(s.summary)}</p>
              <p>${esc(s.intro)}</p>
              <a class="btn btn-primary" href="${svcUrl(s, root)}">Explore ${esc(s.name)}</a>
            </div>
            <div>
              <p class="list-label">What we deliver</p>
              <ul class="check-list">
              ${listItems(s.deliverables.slice(0, 5), 'i-check')}
              </ul>
            </div>
          </article>`).join('\n')}
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <header class="section-head">
          <p class="eyebrow">Expertise</p>
          <h2 class="section-title">Where we also advise</h2>
          <p class="lead">Our insights show the wider ground we cover with leadership teams, from strategy and pricing to governance and culture.</p>
        </header>
        <div class="card-grid">
${site.expertise.map(x => `          <article class="card">
            <h3>${esc(x.name)}</h3>
            <p>${esc(x.description)}</p>
            <ul class="check-list">${listItems((x.topics || []).slice(0, 4), 'i-check')}</ul>
            ${x.related_posts && x.related_posts.length && byN(x.related_posts[0]) ? `<a class="card-link" href="${root}insights.html#${attr(slugCat(x.name))}">Read related insights<span class="sr-only"> on ${esc(x.name)}</span> ${icon('i-arrow')}</a>` : ''}
          </article>`).join('\n')}
        </div>
      </div>
    </section>
${ctaBand(root)}`
})]);
function slugCat(name) { return 'topic-' + String(name).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

// ---------- services/<slug>.html ----------
services.forEach((s, i) => {
  const prev = services[(i + services.length - 1) % services.length], next = services[(i + 1) % services.length];
  const related = (s.related_posts || []).map(byN).filter(Boolean).slice(0, 3);
  const heroImg = related.find(a => IMG[a.n]);
  pages.push([`services/${s.slug}.html`, layout({
    file: `services/${s.slug}.html`, active: 'services',
    title: `${s.name} | ImproFact`,
    description: `${s.summary} ${s.intro}`.slice(0, 158),
    image: heroImg ? IMG[heroImg.n] : 'og-image',
    schema: { '@context': 'https://schema.org', '@type': 'Service', name: s.name, description: s.summary, provider: { '@type': 'Organization', name: 'ImproFact', url: BASE }, areaServed: 'Worldwide' },
    body: root => `
    <section class="page-hero">
      <div class="container page-hero-grid">
        <div>
          ${crumbs(root, [['services.html', 'Services'], [null, s.name]])}
          <span class="page-hero-icon svc-ic-${s.n}">${icon(s.icon)}</span>
          <p class="eyebrow">Service ${s.n} of ${services.length}</p>
          <h1 class="page-title">${esc(s.name)}</h1>
          <p class="lead"><strong>${esc(s.summary)}</strong> ${esc(s.intro)}</p>
          <div class="btn-row">
            <a class="btn btn-primary btn-lg" href="${root}contact.html?request=consultation">Request a Consultation</a>
            <a class="btn btn-ghost btn-lg" href="${root}how-we-work.html">How we work</a>
          </div>
        </div>
        ${heroImg ? `<figure class="page-hero-media">${img(IMG[heroImg.n], root, `ImproFact graphic: ${heroImg.title}`, { lazy: false, sizes: '(min-width: 1024px) 480px, 100vw' })}</figure>` : ''}
      </div>
    </section>

    <section class="section">
      <div class="container two-col">
        <div>
          <p class="eyebrow">Signs you need this</p>
          <h2 class="h3">Sound familiar?</h2>
          <ul class="check-list is-issue">
              ${listItems(s.problems, 'i-alert')}
          </ul>
        </div>
        <div>
          <p class="eyebrow">What we deliver</p>
          <h2 class="h3">What you get</h2>
          <ul class="check-list">
              ${listItems(s.deliverables, 'i-check')}
          </ul>
        </div>
      </div>
    </section>

    <section class="section section-navy">
      <div class="container">
        <p class="eyebrow">Outcomes</p>
        <h2 class="section-title">What changes for your organization</h2>
        <div class="outcomes">
${s.outcomes.map(o => `          <div class="outcome">${icon('i-trend')}<span>${esc(o)}</span></div>`).join('\n')}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <header class="section-head">
          <p class="eyebrow">In practice</p>
          <h2 class="section-title">What it looks like</h2>
        </header>
        <div class="card-grid">
${(s.examples || []).map(e => `          <div class="principle"><p>${esc(e)}</p></div>`).join('\n')}
        </div>
      </div>
    </section>
${related.length ? `
    <section class="section section-alt">
      <div class="container">
        <header class="section-head section-head-row">
          <div><p class="eyebrow">Insights</p><h2 class="section-title">Related reading</h2></div>
          <a class="text-link" href="${root}insights.html">All insights ${icon('i-arrow')}</a>
        </header>
        <div class="card-grid">
          ${related.map(a => postCard(a, root)).join('\n          ')}
        </div>
      </div>
    </section>` : ''}

    <section class="section">
      <div class="container">
        <nav class="article-nav" aria-label="More services">
          <a class="text-link" href="${svcUrl(prev, root)}">← ${esc(prev.name)}</a>
          <a class="text-link" href="${svcUrl(next, root)}">${esc(next.name)} ${icon('i-arrow')}</a>
        </nav>
      </div>
    </section>
${ctaBand(root, `Let's talk about ${s.name.replace(/&amp;/g, '&')}`)}`
  })]);
});

// ---------- how-we-work.html ----------
const hw = site.how_we_work;
pages.push(['how-we-work.html', layout({
  file: 'how-we-work.html', active: 'how',
  title: 'How We Work | ImproFact Engagement Approach',
  description: 'How ImproFact works: from understanding your business to designing, implementing and sustaining improvement. Principles, steps and ways to work with us.',
  image: 'post-30-60-90',
  body: root => `
    <section class="page-hero">
      <div class="container page-hero-grid">
        <div>
          ${crumbs(root, [[null, 'How we work']])}
          <p class="eyebrow">How we work</p>
          <h1 class="page-title">From the inside out, one step at a time</h1>
          <p class="lead">We start by understanding how your business really works, remove what adds no value, then design, implement and measure what does. Clear steps, shared ownership, measurable results.</p>
        </div>
        <figure class="page-hero-media">${img('post-digital-journey', root, 'ImproFact graphic: the digital transformation journey from governance to SOPs, workflows, digital transformation and better outcomes.', { lazy: false, sizes: '(min-width: 1024px) 480px, 100vw' })}</figure>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <header class="section-head">
          <p class="eyebrow">The engagement journey</p>
          <h2 class="section-title">${hw.steps.length} steps to lasting improvement</h2>
        </header>
        <ol class="timeline">
${hw.steps.map((st, i) => `          <li class="tl-step">
            <span class="tl-num" aria-hidden="true">${i + 1}</span>
            <div class="tl-body">
              <p class="tl-kicker">Step ${i + 1} · ${esc(st.name)}</p>
              <h3>${esc(st.title)}</h3>
              <p>${esc(st.description)}</p>
              <ul class="check-list">
              ${listItems(st.activities, 'i-check')}
              </ul>
            </div>
          </li>`).join('\n')}
        </ol>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <header class="section-head">
          <p class="eyebrow">Our principles</p>
          <h2 class="section-title">What guides every engagement</h2>
        </header>
        <div class="card-grid">
${hw.principles.map(p => `          <div class="principle">
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.description)}</p>
            ${p.source_post && byN(p.source_post) ? `<a class="text-link" href="${artUrl(byN(p.source_post), root)}">Read: ${esc(byN(p.source_post).title)}</a>` : ''}
          </div>`).join('\n')}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <header class="section-head">
          <p class="eyebrow">Ways to work with us</p>
          <h2 class="section-title">Choose the right starting point</h2>
        </header>
        <div class="card-grid">
${hw.engagement_models.map((m, i) => `          <article class="card">
            <span class="card-ic">${icon(['i-search', 'i-map', 'i-calendar', 'i-team'][i % 4])}</span>
            <h3>${esc(m.name)}</h3>
            <p>${esc(m.description)}</p>
            <p><strong>Best for:</strong> ${esc(m.best_for)}</p>
          </article>`).join('\n')}
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <header class="section-head">
          <p class="eyebrow">Questions</p>
          <h2 class="section-title">Frequently asked</h2>
        </header>
        <div class="faq">
${site.faq.map(f => `          <details><summary>${esc(f.q || f.question)}</summary><p>${esc(f.a || f.answer)}</p></details>`).join('\n')}
        </div>
      </div>
    </section>
${ctaBand(root)}`,
  schema: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: site.faq.map(f => ({ '@type': 'Question', name: f.q || f.question, acceptedAnswer: { '@type': 'Answer', text: f.a || f.answer } })) }
})]);

// ---------- insights.html ----------
const cats = [...new Set(articles.map(a => a.category))];
pages.push(['insights.html', layout({
  file: 'insights.html', active: 'insights',
  title: 'Insights | ImproFact on Operations, Governance, Strategy and People',
  description: `${articles.length} practical articles from ImproFact on processes, workflows, governance, strategy, pricing, people and digital transformation.`,
  body: root => `
    <section class="page-hero">
      <div class="container">
        ${crumbs(root, [[null, 'Insights']])}
        <p class="eyebrow">Insights</p>
        <h1 class="page-title">Ideas that improve how business works</h1>
        <p class="lead">${articles.length} practical articles from ImproFact on operations, governance, strategy and people.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="filters" role="group" aria-label="Filter by topic">
          <button type="button" data-filter="all" aria-pressed="true">All topics</button>
${cats.map(c => `          <button type="button" data-filter="${attr(c)}" aria-pressed="false">${esc(c)}</button>`).join('\n')}
        </div>
        <p class="sr-only" id="filter-status" aria-live="polite"></p>
        <h2 class="sr-only">All articles</h2>
        <div class="card-grid">
${cats.map(c => `          <span id="${slugCat(c)}" hidden></span>`).join('\n')}
          ${articles.map((a, i) => postCard(a, root, i < 3)).join('\n          ')}
        </div>
      </div>
    </section>
${ctaBand(root, 'Want these ideas applied to your business?')}`
})]);

// ---------- insights/<slug>.html ----------
articles.forEach((a, i) => {
  const ar = a.lang === 'ar';
  const svc = services.find(s => s.slug === a.service);
  const prev = articles[i - 1], next = articles[i + 1];
  pages.push([`insights/${a.slug}.html`, layout({
    file: `insights/${a.slug}.html`, active: 'insights', lang: a.lang,
    title: `${a.title} | ImproFact Insights`,
    description: a.summary.slice(0, 158),
    image: IMG[a.n] || 'og-image',
    schema: { '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.summary, inLanguage: a.lang, author: { '@type': 'Organization', name: 'ImproFact' }, publisher: { '@type': 'Organization', name: 'ImproFact', logo: { '@type': 'ImageObject', url: BASE + 'assets/img/logo-200.jpg' } }, image: BASE + 'assets/img/' + (IMG[a.n] || 'og-image') + '.jpg' },
    body: root => `
    <section class="page-hero">
      <div class="container"${ar ? ' dir="rtl"' : ''}>
        ${crumbs(root, [['insights.html', 'Insights'], [null, a.title]])}
        <span class="tag">${esc(a.category)}</span>
        <h1 class="page-title article-title" style="margin-top:var(--space-4)">${esc(a.title)}</h1>
        <p class="lead">${esc(a.summary)}</p>
      </div>
    </section>

    <section class="section">
      <div class="container article-wrap">
        <article>
          ${IMG[a.n] ? `<figure class="article-figure">${img(IMG[a.n], root, `ImproFact graphic for ${a.title}`, { lazy: false, sizes: '(min-width: 1024px) 720px, 100vw' })}</figure>` : ''}
          <div class="prose"${ar ? ' dir="rtl" lang="ar"' : ''}${IMG[a.n] ? ' style="margin-top:var(--space-6)"' : ''}>
            ${renderBlocks(a.blocks)}
          </div>
          ${a.original ? `<details class="original" lang="${a.original.lang}">
            <summary>Read the original in Arabic</summary>
            <div class="prose" dir="rtl">
            <h2>${esc(a.original.title)}</h2>
            ${renderBlocks(a.original.blocks)}
            </div>
          </details>` : ''}
          <p class="article-meta">${a.original ? 'Translated from Arabic. ' : ''}Originally shared by ImproFact on <a href="${a.linkedin ? liUrl(a) : 'https://www.linkedin.com/company/improfact/posts/'}" target="_blank" rel="noopener">LinkedIn</a>.</p>
          <nav class="article-nav" aria-label="More articles">
            ${prev ? `<a class="text-link" href="${artUrl(prev, root)}">← ${esc(prev.title)}</a>` : '<span></span>'}
            ${next ? `<a class="text-link" href="${artUrl(next, root)}">${esc(next.title)} →</a>` : ''}
          </nav>
        </article>
        <aside>
          <div class="aside-card">
            <h2>Work with ImproFact</h2>
            ${svc ? `<p>This topic connects to our <a href="${svcUrl(svc, root)}">${esc(svc.name)}</a> service.</p>` : `<p>Turn these ideas into results in your organization.</p>`}
            <a class="btn btn-primary" href="${root}contact.html?request=consultation">Request a Consultation</a>
            <a class="btn btn-ghost" href="${root}contact.html?request=audit">Schedule an Operational Audit</a>
          </div>
        </aside>
      </div>
    </section>`
  })]);
});

// ---------- about.html ----------
const ab = site.about;
pages.push(['about.html', layout({
  file: 'about.html', active: 'about',
  title: 'About ImproFact | Business Improvement Consulting, Tripoli & Worldwide',
  description: 'ImproFact helps organizations and individuals improve their performance from the inside out. Based in Tripoli, North Lebanon, working with clients worldwide.',
  body: root => `
    <section class="page-hero">
      <div class="container page-hero-grid">
        <div>
          ${crumbs(root, [[null, 'About']])}
          <p class="eyebrow">About ImproFact</p>
          <h1 class="page-title">Where Improvement meets Excellence</h1>
          <p class="lead">${esc(ab.who_we_are)}</p>
        </div>
        <figure class="page-hero-media">${img('post-addition-subtraction', root, 'ImproFact graphic: Addition by Subtraction. Sometimes less creates more.', { lazy: false, sizes: '(min-width: 1024px) 480px, 100vw' })}</figure>
      </div>
    </section>

    <section class="section">
      <div class="container two-col">
        <div>
          <p class="eyebrow">Our mission</p>
          <p class="quote">${esc(ab.mission)}</p>
        </div>
        <div>
          <p class="eyebrow">Our approach</p>
          <p class="lead" style="margin-top:0">${esc(ab.approach)}</p>
          <a class="text-link" href="${root}how-we-work.html">See how we work ${icon('i-arrow')}</a>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <header class="section-head">
          <p class="eyebrow">Our values</p>
          <h2 class="section-title">What we stand for</h2>
        </header>
        <div class="card-grid">
${ab.values.map(v => `          <div class="principle"><h3>${esc(v.name)}</h3><p>${esc(v.description)}</p></div>`).join('\n')}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <header class="section-head">
          <p class="eyebrow">At a glance</p>
          <h2 class="section-title">ImproFact in brief</h2>
        </header>
        <div class="facts">
          <div class="fact">${icon('i-pin')}<div><strong>Based in Tripoli</strong><span>North Lebanon</span></div></div>
          <div class="fact">${icon('i-globe')}<div><strong>Global remote consulting</strong><span>Working with organizations worldwide</span></div></div>
          <div class="fact">${icon('i-chat')}<div><strong>${esc((ab.languages || ['English']).join(' & '))}</strong><span>Languages we work in</span></div></div>
          <div class="fact">${icon('i-layers')}<div><strong>${services.length} core services</strong><span>From SOPs to quality systems</span></div></div>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <header class="section-head section-head-row">
          <div><p class="eyebrow">What we do</p><h2 class="section-title">Our services</h2></div>
          <a class="text-link" href="${root}services.html">All services ${icon('i-arrow')}</a>
        </header>
        <div class="card-grid">
${services.map(s => `          <article class="card">
            <span class="card-ic svc-ic-${s.n}">${icon(s.icon)}</span>
            <h3>${esc(s.name)}</h3>
            <p>${esc(s.summary)}</p>
            <a class="card-link" href="${svcUrl(s, root)}">Learn more<span class="sr-only"> about ${esc(s.name)}</span> ${icon('i-arrow')}</a>
          </article>`).join('\n')}
        </div>
      </div>
    </section>
${ctaBand(root)}`
})]);

// ---------- contact.html ----------
pages.push(['contact.html', layout({
  file: 'contact.html', active: 'contact',
  title: 'Contact ImproFact | Schedule an Operational Audit or Consultation',
  description: 'Tell us about your operational bottleneck. ImproFact replies within 1 business day. Global remote consulting, based in Tripoli, North Lebanon.',
  body: root => `
    <section class="page-hero">
      <div class="container">
        ${crumbs(root, [[null, 'Contact']])}
        <p class="eyebrow">Contact</p>
        <h1 class="page-title">Let's improve from the inside out</h1>
        <p class="lead">Schedule an operational audit or request a consultation. Tell us where work slows down and we'll take it from there.</p>
      </div>
    </section>

    ${contactSection.replace('<h2 id="contact-title" class="section-title">Book your operational audit</h2>', '<h2 id="contact-title" class="section-title">Book your operational audit</h2>').replace(/href="privacy\.html"/g, `href="${root}privacy.html"`)}

    <section class="section section-alt">
      <div class="container">
        <header class="section-head">
          <p class="eyebrow">Questions</p>
          <h2 class="section-title">Before you get in touch</h2>
        </header>
        <div class="faq">
${site.faq.map(f => `          <details><summary>${esc(f.q || f.question)}</summary><p>${esc(f.a || f.answer)}</p></details>`).join('\n')}
        </div>
      </div>
    </section>`
})]);

// ---------- privacy.html (body kept in content/privacy.html) ----------
pages.push(['privacy.html', layout({
  file: 'privacy.html', active: null,
  title: 'Privacy Policy | ImproFact',
  description: 'How ImproFact collects and uses the information you send through this website.',
  body: root => `
    <div class="container policy">
      ${crumbs(root, [[null, 'Privacy policy']])}
      ${read('content/privacy.html')}
    </div>`
}).replace('<meta name="theme-color"', '<meta name="robots" content="noindex">\n  <meta name="theme-color"')]);

// ---------- write pages ----------
for (const [f, html] of pages) write(f, html);

// ---------- shared header/footer into the hand-written pages ----------
function injectShared(file, active, home) {
  let h = read(file);
  const swap = (h, open, close, html, fallbackRe) => h.includes(open) ? h.slice(0, h.indexOf(open)) + html + h.slice(h.indexOf(close) + close.length) : h.replace(fallbackRe, html);
  h = swap(h, '<!-- site:header -->', '<!-- /site:header -->', header('', active, home), /<header class="site-header"[\s\S]*?<\/header>/);
  if (home) h = swap(h, '<!-- site:footer -->', '<!-- /site:footer -->', footer(''), /(<!-- 6\. FOOTER -->\s*)?<footer class="site-footer">[\s\S]*?<\/footer>/);
  write(file, h);
}
injectShared('index.html', 'home', true);

// ---------- sitemap + robots ----------
const urls = ['', 'privacy.html', ...pages.map(p => p[0])];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${BASE}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
console.log(`Built ${pages.length} pages + sitemap (${urls.length} URLs).`);
