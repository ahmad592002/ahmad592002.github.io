/* ImproFact landing page — progressive enhancement. The page is fully readable without this file. */
(function () {
  'use strict';

  var CFG = window.IMPROFACT_CONFIG || {};
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };

  /* ---------- Config-driven text ---------- */
  $$('[data-config]').forEach(function (el) { var v = CFG[el.getAttribute('data-config')]; if (v) el.textContent = v; });
  $$('[data-config-href]').forEach(function (el) { var v = CFG[el.getAttribute('data-config-href')]; if (v) el.href = v; });
  $$('[data-config-mail]').forEach(function (el) { var v = CFG[el.getAttribute('data-config-mail')]; if (v) el.href = 'mailto:' + v; });
  var yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Analytics ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(event, params) {
    var data = Object.assign({ event: event }, params || {});
    window.dataLayer.push(data);
    if (typeof window.gtag === 'function') window.gtag('event', event, params || {});
  }
  function loadAnalytics() {
    if (!CFG.analyticsId || window.gtag) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CFG.analyticsId);
    document.head.appendChild(s);
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', CFG.analyticsId);
  }
  (function cookieNotice() {
    if (!CFG.analyticsId) return;
    var choice = null;
    try { choice = localStorage.getItem('if_consent'); } catch (e) {}
    if (choice === 'yes') { loadAnalytics(); return; }
    if (choice === 'no') return;
    var box = $('#cookie'); if (!box) return;
    box.hidden = false;
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]'); if (!b) return;
      var v = b.getAttribute('data-consent');
      try { localStorage.setItem('if_consent', v); } catch (err) {}
      if (v === 'yes') loadAnalytics();
      box.hidden = true;
    });
  })();
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-track]');
    if (t) track('cta_click', { cta: t.getAttribute('data-track') });
  });

  /* ---------- Header ---------- */
  var header = $('.site-header');
  var onScrollHeader = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScrollHeader, { passive: true }); onScrollHeader();

  /* ---------- Mobile menu ---------- */
  (function mobileNav() {
    var btn = $('.nav-toggle'), nav = $('#site-nav'); if (!btn || !nav) return;
    function set(open) {
      header.classList.toggle('nav-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      $('use', btn).setAttribute('href', open ? '#i-x' : '#i-menu');
    }
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && header.classList.contains('nav-open')) { set(false); btn.focus(); } });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function () { set(false); });
  })();

  /* ---------- Insights: topic filter ---------- */
  (function insightFilter() {
    var bar = $('.filters'); if (!bar) return;
    var buttons = $$('button', bar), cards = $$('[data-category]');
    bar.hidden = false;
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var cat = b.getAttribute('data-filter');
      buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      cards.forEach(function (c) { c.hidden = cat !== 'all' && c.getAttribute('data-category') !== cat; });
      var shown = cards.filter(function (c) { return !c.hidden; }).length;
      var live = $('#filter-status'); if (live) live.textContent = shown + ' article' + (shown === 1 ? '' : 's') + ' shown';
      track('component_interaction', { component: 'insights', action: 'filter', value: cat });
    });
    // insights.html#topic-strategy-and-growth opens with that topic selected
    var slug = function (s) { return 'topic-' + s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
    var pre = buttons.filter(function (b) { return slug(b.getAttribute('data-filter')) === location.hash.slice(1); })[0];
    if (pre) { pre.click(); bar.scrollIntoView({ block: 'start' }); }
  })();

  /* ---------- Reveal on scroll (once) ---------- */
  function onceInView(el, cb, threshold) {
    if (!('IntersectionObserver' in window)) { cb(el); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { io.disconnect(); cb(el); } });
    }, { threshold: threshold || 0.2 });
    io.observe(el);
  }

  /* ---------- What we do: services rise in sequence ---------- */
  (function services() {
    var grid = $('.svc-grid'); if (!grid) return;
    grid.classList.add('reveal');
    onceInView(grid, function () { grid.classList.add('in-view'); }, 0.2);
  })();

  /* ---------- 1. Storefront vs operations diagram ---------- */
  (function storefront() {
    var root = $('#storefront'); if (!root) return;
    var desc = $('#sf-model-desc');
    var models = {
      ecommerce: 'You own stock, pricing, fulfilment and returns.',
      dropshipping: 'Suppliers ship for you. Coordination and returns become critical.',
      marketplace: 'Many sellers, one platform. Trust, payments and seller KPIs decide.',
      d2c: 'The brand sells direct, so supply and inventory planning lead.'
    };
    var radios = $$('[role="radio"]', root);
    var nodes = $$('.sf-node', root);
    function setModel(m, announce) {
      root.setAttribute('data-model', m);
      radios.forEach(function (r) {
        var on = r.getAttribute('data-model') === m;
        r.setAttribute('aria-checked', on); r.tabIndex = on ? 0 : -1;
      });
      nodes.forEach(function (n) {
        var key = (n.getAttribute('data-models') || '').split(' ').indexOf(m) > -1;
        n.classList.toggle('is-key', key);
        n.classList.remove('is-pulse');
        if (key && !reduceMotion && announce) { void n.offsetWidth; n.classList.add('is-pulse'); }
      });
      if (desc) desc.textContent = models[m] || '';
    }
    radioGroup(radios, function (r) { setModel(r.getAttribute('data-model'), true); track('component_interaction', { component: 'storefront', action: 'model', value: r.getAttribute('data-model') }); });
    nodes.forEach(function (n) {
      var btn = $('.sf-node-btn', n);
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        if (!open) track('component_interaction', { component: 'storefront', action: 'open_node', value: $('span', btn).textContent });
      });
    });
    setModel('ecommerce', false);
    // Autoplay: next model, pulse its key nodes and open one to show what breaks
    var order = ['ecommerce', 'dropshipping', 'marketplace', 'd2c'];
    var feature = { ecommerce: 'w-inventory', dropshipping: 'w-supply', marketplace: 'w-fraud', d2c: 'w-kpi' };
    var autoOpened = null;
    function openFeature(m) {
      if (autoOpened) autoOpened.setAttribute('aria-expanded', 'false');
      autoOpened = root.querySelector('[aria-controls="' + feature[m] + '"]');
      if (autoOpened) autoOpened.setAttribute('aria-expanded', 'true');
    }
    autoplay({
      name: 'storefront', root: root, mount: $('.sf-auto', root), interval: 4200, live: [desc],
      step: function () {
        var m = order[(order.indexOf(root.getAttribute('data-model')) + 1) % order.length];
        setModel(m, true); openFeature(m);
      }
    });
    onceInView(root, function () {
      root.classList.add('in-view');
      if (!reduceMotion) setTimeout(function () { setModel(root.getAttribute('data-model'), true); }, 900);
    }, 0.3);
  })();

  /* Shared: roving-tabindex radio group with arrow keys */
  function radioGroup(radios, onSelect) {
    radios.forEach(function (r, i) {
      r.tabIndex = r.getAttribute('aria-checked') === 'true' ? 0 : -1;
      r.addEventListener('click', function () { onSelect(r); });
      r.addEventListener('keydown', function (e) {
        var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var next = radios[(i + d + radios.length) % radios.length];
        next.focus(); onSelect(next);
      });
    });
  }

  /* Shared: guided autoplay. Advances a component on its own until the visitor
     interacts with it; a Pause/Play button gives full control (WCAG 2.2.2).
     Runs only while on screen, and never starts by itself under reduced motion. */
  function autoplay(o) {
    var timer = null, playing = !reduceMotion, inView = false;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'auto-btn';
    btn.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-pause"/></svg><span></span>';
    o.mount.appendChild(btn);
    function label() {
      btn.querySelector('use').setAttribute('href', playing ? '#i-pause' : '#i-play');
      btn.querySelector('span').textContent = playing ? 'Pause' : 'Play';
      btn.setAttribute('aria-label', (playing ? 'Pause' : 'Play') + ' the automatic tour');
      o.root.classList.toggle('is-auto', playing);
      (o.live || []).forEach(function (el) { if (el) el.setAttribute('aria-live', playing ? 'off' : 'polite'); });
    }
    function schedule() {
      clearTimeout(timer);
      if (!playing || !inView || document.hidden) return;
      var ms = typeof o.interval === 'function' ? o.interval() : o.interval;
      o.root.style.setProperty('--auto-ms', ms + 'ms');
      timer = setTimeout(function () { o.step(); schedule(); }, ms);
    }
    function set(on) { playing = on; label(); schedule(); }
    btn.addEventListener('click', function () {
      set(!playing);
      track('component_interaction', { component: o.name, action: playing ? 'autoplay_on' : 'autoplay_off' });
    });
    // Any visitor interaction inside the component hands control back to them
    ['pointerdown', 'click', 'keydown', 'focusin'].forEach(function (ev) {
      o.root.addEventListener(ev, function (e) { if (playing && !btn.contains(e.target)) set(false); }, true);
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; schedule(); }, { threshold: 0.35 }).observe(o.root);
    } else { inView = true; }
    document.addEventListener('visibilitychange', schedule);
    label(); schedule();
  }

  /* ---------- Pillar tabs ---------- */
  (function tabs() {
    var list = $('.tabs[role="tablist"]'); if (!list) return;
    var tabs = $$('[role="tab"]', list);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    list.hidden = false;
    list.classList.add('reveal');
    onceInView(list, function () { list.classList.add('in-view'); });
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
      document.dispatchEvent(new CustomEvent('pillar:shown', { detail: panels[i].id }));
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); track('component_interaction', { component: 'pillar_tabs', action: 'select', value: t.id }); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(n, true); }
      });
    });
    select(0);
    // Deep links (#pillar-b) open the matching tab
    function fromHash() {
      var idx = panels.findIndex(function (p) { return '#' + p.id === location.hash; });
      if (idx > -1) select(idx);
    }
    window.addEventListener('hashchange', fromHash); fromHash();
  })();

  /* ---------- 3. Before / after cards ---------- */
  function setBA(card, toAfter) {
    var btn = $('.ba-toggle', card); if (!btn) return;
    btn.setAttribute('aria-pressed', String(toAfter));
    btn.textContent = toAfter ? 'Show before' : 'Show after';
    if (toAfter && !reduceMotion) {
      card.classList.add('is-cutting');
      setTimeout(function () { card.classList.remove('is-cutting'); card.setAttribute('data-state', 'after'); }, 340);
    } else {
      card.setAttribute('data-state', toAfter ? 'after' : 'before');
    }
  }
  $$('.ba').forEach(function (card) {
    var btn = $('.ba-toggle', card); if (!btn) return;
    btn.addEventListener('click', function () {
      var toAfter = card.getAttribute('data-state') === 'before';
      track('component_interaction', { component: 'before_after', action: 'toggle', value: toAfter ? 'after' : 'before' });
      setBA(card, toAfter);
    });
  });

  // One process at a time (selector); without JS all three cards stay visible
  (function baPicker() {
    var pick = $(".ba-pick"); if (!pick) return;
    var radios = $$("[role=\"radio\"]", pick);
    function show(id) {
      radios.forEach(function (r) { var on = r.getAttribute("data-ba") === id; r.setAttribute("aria-checked", on); r.tabIndex = on ? 0 : -1; });
      $$(".ba").forEach(function (card) { card.classList.toggle("is-shown", card.id === "ba-" + id); });
    }
    pick.hidden = false;
    radioGroup(radios, function (r) { show(r.getAttribute("data-ba")); track("component_interaction", { component: "before_after", action: "process", value: r.getAttribute("data-ba") }); });
    show(radios[0].getAttribute("data-ba"));
    // Autoplay: desktop cycles processes; mobile flips Before -> After, then moves on
    var mobile = window.matchMedia("(max-width: 767px)");
    autoplay({
      name: "before_after", root: pick.parentElement, mount: $(".ba-head", pick.parentElement),
      interval: function () { return mobile.matches ? 3200 : 5200; },
      step: function () {
        var cur = radios.filter(function (r) { return r.getAttribute("aria-checked") === "true"; })[0];
        var card = document.getElementById("ba-" + cur.getAttribute("data-ba"));
        if (mobile.matches && card.getAttribute("data-state") === "before") { setBA(card, true); return; }
        var next = radios[(radios.indexOf(cur) + 1) % radios.length];
        setBA(card, false);
        show(next.getAttribute("data-ba"));
      }
    });
  })();

  /* ---------- Insights rail: arrow buttons ---------- */
  (function rail() {
    var list = $("#rail"); if (!list) return;
    var prev = $(".rail-prev"), next = $(".rail-next");
    prev.hidden = false; next.hidden = false;
    function step() { return Math.max(260, list.clientWidth * 0.8); }
    function update() {
      var max = list.scrollWidth - list.clientWidth - 2;
      prev.disabled = list.scrollLeft <= 2;
      next.disabled = list.scrollLeft >= max;
    }
    prev.addEventListener("click", function () { list.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" }); track("component_interaction", { component: "insights", action: "prev" }); });
    next.addEventListener("click", function () { list.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" }); track("component_interaction", { component: "insights", action: "next" }); });
    list.addEventListener("scroll", function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("load", update);
    update();
  })();

  /* ---------- 4. Approval workflow preview ---------- */
  (function workflow() {
    var root = $('#workflow'); if (!root) return;
    var wrap = $('.wf-stage-wrap', root);
    var track_ = $('.wf-track', root);
    var all = $$('.wf-stage', root);
    var token = $('.wf-token', root);
    var loop = $('.wf-loop', root);
    var detail = $('.wf-detail', root);
    var controls = $('.wf-controls', root);
    var bBack = $('[data-wf="back"]', root), bNext = $('[data-wf="next"]', root), bReject = $('[data-wf="reject"]', root);
    var tierRadios = $$('[role="radio"]', root);
    var tier = 'standard';
    var idx = 0;
    var msg = { text: '', cls: '' };
    detail.hidden = false; controls.hidden = false;

    function stages() { return all.filter(function (s) { return tier === 'regulated' || !s.hasAttribute('data-regulated'); }); }
    function centre(el) {
      var w = wrap.getBoundingClientRect(), r = $('.wf-dot', el).getBoundingClientRect();
      return { x: r.left - w.left + r.width / 2, y: r.top - w.top + r.height / 2 };
    }
    function vertical() { return !window.matchMedia('(min-width: 768px)').matches; }
    function placeToken() {
      var s = stages()[idx]; if (!s) return;
      var c = centre(s);
      token.style.transform = 'translate(' + c.x + 'px,' + c.y + 'px)';
    }
    // Arrow starts at the rejecting stage's circle and ends on the author's circle
    function showLoop(authorEl, fromEl) {
      var a = centre(fromEl), b = centre(authorEl), R = 24, RE = 32, d; // RE clears the token ring
      if (vertical()) {               // stages stacked: arc out to the left of the circles
        var x = a.x - R, bend = x - 26;
        d = 'M' + x + ' ' + a.y + ' C' + bend + ' ' + a.y + ' ' + bend + ' ' + b.y + ' ' + (b.x - RE) + ' ' + b.y;
      } else {                        // stages in a row: arc over the top of the circles
        var y = a.y - R, lift = y - 34;
        d = 'M' + a.x + ' ' + y + ' C' + a.x + ' ' + lift + ' ' + b.x + ' ' + lift + ' ' + b.x + ' ' + (b.y - RE);
      }
      $('.wf-loop-path', loop).setAttribute('d', d);
      loop.classList.add('is-on');
    }
    function render() {
      var list = stages();
      idx = clamp(idx, 0, list.length - 1);
      var cur = list[idx];
      all.forEach(function (s) {
        var i = list.indexOf(s);
        s.classList.toggle('is-active', s === cur);
        s.classList.toggle('is-done', i > -1 && i < idx);
      });
      $('.wf-detail-step', root).textContent = 'Stage ' + (idx + 1) + ' of ' + list.length;
      $('.wf-detail-name', root).textContent = $('.wf-name', cur).textContent;
      $('.wf-detail-info', root).innerHTML = $('.wf-info', cur).innerHTML;
      var m = $('.wf-detail-msg', root);
      m.textContent = msg.text; m.className = 'wf-detail-msg' + (msg.cls ? ' ' + msg.cls : '');
      bBack.disabled = idx === 0;
      bNext.textContent = idx === list.length - 1 ? 'Start again' : 'Next';
      bReject.disabled = !cur.hasAttribute('data-review');
      placeToken();
    }
    function clearReject() { token.classList.remove('is-rejected'); loop.classList.remove('is-on'); }

    function goNext() {
      var list = stages();
      clearReject();
      if (idx === list.length - 1) { idx = 0; msg = { text: '', cls: '' }; }
      else {
        idx++;
        msg = list[idx].getAttribute('data-key') === 'publish' ? { text: 'Approved. Ready to publish.', cls: 'is-good' } : { text: '', cls: '' };
      }
      render();
      return list[idx].getAttribute('data-key');
    }
    function goReject() {
      var list = stages(), cur = list[idx];
      var author = list.filter(function (s) { return s.hasAttribute('data-author'); })[0];
      showLoop(author, cur);
      token.classList.add('is-rejected');
      msg = { text: 'Rejected at ' + $('.wf-name', cur).textContent.toLowerCase() + '. Returned to the author with comments.', cls: 'is-bad' };
      idx = list.indexOf(author);
      render();
      return cur.getAttribute('data-key');
    }
    function setTier(t, restart) {
      var cur = stages()[idx];
      tier = t;
      root.setAttribute('data-tier', tier);
      tierRadios.forEach(function (x) { var on = x.getAttribute('data-tier') === t; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; });
      var list = stages();
      idx = restart ? 0 : (list.indexOf(cur) > -1 ? list.indexOf(cur) : list.indexOf(all[all.indexOf(cur) + 1]));
      clearReject();
      msg = { text: tier === 'regulated' ? 'Regulated content adds a legal / compliance review.' : 'Standard content skips the legal stage.', cls: '' };
      render();
    }
    bNext.addEventListener('click', function () {
      track('component_interaction', { component: 'workflow', action: 'step', value: goNext() });
    });
    bBack.addEventListener('click', function () {
      clearReject(); idx--; msg = { text: '', cls: '' }; render();
      track('component_interaction', { component: 'workflow', action: 'back', value: stages()[idx].getAttribute('data-key') });
    });
    bReject.addEventListener('click', function () {
      track('component_interaction', { component: 'workflow', action: 'reject', value: goReject() });
    });
    radioGroup(tierRadios, function (r) {
      setTier(r.getAttribute('data-tier'), false);
      track('component_interaction', { component: 'workflow', action: 'tier', value: tier });
    });

    // Autoplay script: a standard post runs straight through; a regulated one is
    // rejected at legal review, loops back to the author, then gets published.
    function at(key) { return stages()[idx].getAttribute('data-key') === key; }
    var script = [
      function () { setTier('standard', true); },
      goNext, goNext, goNext, goNext, goNext,          // brief -> archive
      function () { setTier('regulated', true); },
      goNext, goNext, goNext,                          // -> legal / compliance
      goReject,                                        // back to the author
      goNext, goNext, goNext, goNext, goNext           // -> archive
    ];
    var beat = 1;                                      // page already shows the standard start
    autoplay({
      name: 'workflow', root: root, mount: controls, live: [detail],
      interval: function () { return at('archive') || at('legal') ? 2600 : 1700; },
      step: function () { script[beat](); beat = (beat + 1) % script.length; }
    });

    render();
    // Position needs layout: wait until the panel is visible
    function ready() { requestAnimationFrame(function () { placeToken(); root.classList.add('is-ready'); }); }
    document.addEventListener('pillar:shown', function (e) { if (e.detail === 'pillar-c') ready(); });
    window.addEventListener('resize', function () { placeToken(); clearReject(); });
    if (root.offsetParent) ready();
  })();

  /* ---------- Methodology: scroll-linked line ---------- */
  (function steps() {
    var wrap = $('#steps'); if (!wrap) return;
    var items = $$('.step', wrap);
    if (reduceMotion) { items.forEach(function (s) { s.classList.add('is-on'); }); wrap.style.setProperty('--p', 1); return; }
    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight, r = wrap.getBoundingClientRect();
      var line = vh * 0.7;
      var p = clamp((line - r.top) / r.height, 0, 1);
      wrap.style.setProperty('--p', p.toFixed(3));
      items.forEach(function (s) { var sr = s.getBoundingClientRect(); s.classList.toggle('is-on', sr.top + sr.height / 2 < line); });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* ---------- 2. ROI / time-saved calculator ---------- */
  var calcResult = null;
  (function calculator() {
    var form = $('#calc-form'); if (!form) return;
    var A = Object.assign({ meetingReduction: 0.3, targetApprovalLayers: 2, hoursPerApprovalTouch: 0.5, waitDaysPerLayer: 1, weeksPerMonth: 4.33 }, CFG.calculator || {});
    var assume = $('#calc-assume');
    if (assume) {
      assume.textContent = 'Assumes ' + Math.round(A.meetingReduction * 100) + '% of recurring meetings removed, approval layers cut to ' + A.targetApprovalLayers +
        ', ' + Math.round(A.hoursPerApprovalTouch * 60) + ' min of effort per approver and ' + A.waitDaysPerLayer + ' business day' + (A.waitDaysPerLayer === 1 ? '' : 's') + ' of waiting per layer.';
    }
    var labels = { meetings: 'Meetings per week', length: 'Meeting length', attendees: 'Attendees', layers: 'Approval layers', requests: 'Requests per month', cost: 'Hourly cost' };
    var out = { hours: $('#r-hours'), cost: $('#r-cost'), days: $('#r-days'), now: $('#r-now'), opt: $('#r-opt'), bar: $('#bar-opt') };
    var shown = { hours: 0, cost: 0, days: 0 };
    var debounce, interacted = false;

    function read() {
      var vals = {}, ok = true;
      $$('input', form).forEach(function (inp) {
        var err = document.getElementById(inp.id + '-err');
        var min = +inp.min, max = +inp.max, raw = inp.value.trim(), v = Number(raw);
        var bad = raw === '' || !isFinite(v) || v < min || v > max || Math.floor(v) !== v;
        inp.setAttribute('aria-invalid', bad ? 'true' : 'false');
        err.textContent = bad ? labels[inp.name] + ' must be a whole number from ' + min.toLocaleString('en-US') + ' to ' + max.toLocaleString('en-US') + '.' : '';
        if (bad) ok = false; else vals[inp.name] = v;
      });
      return ok ? vals : null;
    }
    function compute(v) {
      var meetH = v.meetings * (v.length / 60) * v.attendees * A.weeksPerMonth;
      var target = Math.min(v.layers, A.targetApprovalLayers);
      var apprH = v.layers * v.requests * A.hoursPerApprovalTouch;
      var saved = meetH * A.meetingReduction + (v.layers - target) * v.requests * A.hoursPerApprovalTouch;
      var now = meetH + apprH;
      return { hours: saved, cost: saved * 12 * v.cost, days: (v.layers - target) * A.waitDaysPerLayer, now: now, opt: now - saved };
    }
    function countTo(key, el, to, decimals) {
      var from = shown[key]; shown[key] = to;
      if (reduceMotion || !interacted) { el.textContent = fmt(to); return; }
      var t0 = performance.now(), dur = 400;
      (function step(t) {
        var k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(from + (to - from) * e);
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }
    function update() {
      var v = read(); if (!v) return;
      var r = compute(v);
      countTo('hours', out.hours, r.hours); countTo('cost', out.cost, r.cost); countTo('days', out.days, r.days);
      out.now.textContent = fmt(r.now) + ' h'; out.opt.textContent = fmt(r.opt) + ' h';
      out.bar.style.setProperty('--r', r.now > 0 ? clamp(r.opt / r.now, 0, 1).toFixed(3) : 1);
      calcResult = { hours_saved_per_month: Math.round(r.hours), cost_saved_per_year_usd: Math.round(r.cost), approval_days_cut: r.days, inputs: v, assumptions: A };
    }
    form.addEventListener('input', function () {
      interacted = true;
      clearTimeout(debounce);
      debounce = setTimeout(function () { update(); track('component_interaction', { component: 'calculator', action: 'calculate' }); }, 250);
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    update();
  })();

  /* ---------- CTAs: set request type, bottleneck, calculator result ---------- */
  var reqInput = $('#f-request'), calcInput = $('#f-calc'), bottleneck = $('#f-bottleneck'), carry = $('#calc-carry');
  // Links from other pages: contact.html?request=consultation&bottleneck=process
  (function prefillFromUrl() {
    if (!reqInput) return;
    try {
      var q = new URLSearchParams(location.search);
      var r = q.get('request'), b = q.get('bottleneck');
      if (r === 'audit' || r === 'consultation') reqInput.value = r;
      if (b && bottleneck.querySelector('option[value="' + b.replace(/[^a-z]/g, '') + '"]')) bottleneck.value = b;
    } catch (e) {}
  })();
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-request]'); if (!a || !reqInput || a.getAttribute('href').charAt(0) !== '#') return;
    reqInput.value = a.getAttribute('data-request');
    var b = a.getAttribute('data-bottleneck');
    if (b) { bottleneck.value = b; bottleneck.dispatchEvent(new Event('change')); }
    if (a.hasAttribute('data-calc') && calcResult) {
      calcInput.value = JSON.stringify(calcResult);
      carry.textContent = 'Your estimate is attached: about ' + fmt(calcResult.hours_saved_per_month) + ' hours a month and $' + fmt(calcResult.cost_saved_per_year_usd) + ' a year.';
      carry.hidden = false;
    }
    setTimeout(function () { var f = $('#f-name'); if (f && !f.value) f.focus({ preventScroll: true }); }, reduceMotion ? 0 : 600);
  });

  /* ---------- 5. Lead form ---------- */
  (function leadForm() {
    var form = $('#lead-form'); if (!form) return;
    var loadedAt = Date.now();
    var status = $('#form-status');
    var f = {
      name: $('#f-name'), email: $('#f-email'), company: $('#f-company'), size: $('#f-size'),
      bottleneck: $('#f-bottleneck'), details: $('#f-details'), consent: $('#f-consent'), hp: $('#f-website')
    };
    var FREE = /@(gmail|googlemail|yahoo|ymail|outlook|hotmail|live|msn|icloud|me|aol|proton|protonmail|gmx|mail)\.[a-z.]+$/i;
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var started = false;

    form.classList.add('reveal');
    onceInView(form, function () { form.classList.add('in-view'); }, 0.1);

    // UTM capture (persist for the session)
    var utm = {};
    try {
      var qs = new URLSearchParams(location.search);
      ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) {
        var v = qs.get(k) || sessionStorage.getItem(k) || '';
        utm[k] = v; if (v) sessionStorage.setItem(k, v);
      });
    } catch (e) { utm = { utm_source: '', utm_medium: '', utm_campaign: '' }; }

    function setErr(el, text) {
      var err = document.getElementById(el.id + '-err');
      el.setAttribute('aria-invalid', text ? 'true' : 'false');
      if (err) err.textContent = text || '';
      return !text;
    }
    var rules = {
      name: function () { var v = f.name.value.trim(); return v.length < 2 ? 'Enter your full name.' : v.length > 80 ? 'Use 80 characters or fewer.' : ''; },
      email: function () { var v = f.email.value.trim(); return !v ? 'Enter your business email.' : !EMAIL.test(v) ? 'Enter a valid email, like name@company.com.' : ''; },
      company: function () { var v = f.company.value.trim(); return v.length < 2 ? 'Enter your company or organisation.' : v.length > 120 ? 'Use 120 characters or fewer.' : ''; },
      size: function () { return f.size.value ? '' : 'Choose your company size.'; },
      bottleneck: function () { return f.bottleneck.value ? '' : 'Choose your main bottleneck.'; },
      details: function () { var v = f.details.value.trim(); return f.bottleneck.value === 'other' && !v ? 'Tell us a little about the bottleneck.' : v.length > 1000 ? 'Use 1,000 characters or fewer.' : ''; },
      consent: function () { return f.consent.checked ? '' : 'Please agree so we can contact you.'; }
    };
    function check(key) { return setErr(f[key], rules[key]()); }
    function emailWarn() {
      var w = $('#f-email-warn');
      w.textContent = EMAIL.test(f.email.value.trim()) && FREE.test(f.email.value.trim()) ? 'Looks like a personal address. That’s fine, but a work email helps us prepare.' : '';
    }

    Object.keys(rules).forEach(function (k) {
      var el = f[k];
      el.addEventListener('blur', function () { if (el.dataset.touched || el.value) { el.dataset.touched = '1'; check(k); } });
      el.addEventListener(el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input', function () {
        if (el.getAttribute('aria-invalid') === 'true') check(k);
        if (k === 'email') emailWarn();
      });
    });
    f.bottleneck.addEventListener('change', function () {
      if (f.details.getAttribute('aria-invalid') === 'true' || f.bottleneck.value !== 'other') check('details');
      f.details.required = f.bottleneck.value === 'other';
    });
    f.details.addEventListener('input', function () { $('#f-details-count').textContent = f.details.value.length.toLocaleString('en-US') + ' / 1,000'; });
    form.addEventListener('focusin', function () { if (!started) { started = true; track('form_start'); } });

    function payload() {
      var opt = f.bottleneck.options[f.bottleneck.selectedIndex];
      var calc = null; try { calc = calcInput.value ? JSON.parse(calcInput.value) : null; } catch (e) {}
      return Object.assign({
        full_name: f.name.value.trim(),
        email: f.email.value.trim(),
        company: f.company.value.trim(),
        company_size: f.size.value,
        bottleneck: f.bottleneck.value,
        bottleneck_label: opt ? opt.text : '',
        details: f.details.value.trim(),
        request_type: reqInput.value || 'audit',
        calculator_result: calc,
        consent: f.consent.checked,
        referrer: document.referrer || '',
        page_url: location.href,
        submitted_at: new Date().toISOString()
      }, utm);
    }

    // ---- Sending: the visitor picks WhatsApp or Email; we pre-write the message ----
    var WA_NUMBER = String(CFG.whatsappNumber || '').replace(/\D/g, '');
    var lastChannel = 'email';
    $$('button[name="channel"]', form).forEach(function (b) {
      b.addEventListener('click', function () { lastChannel = b.value; });
    });

    function message(d) {
      var lines = [
        'Hello ImproFact,',
        '',
        d.request_type === 'consultation' ? 'I would like to request a consultation.' : 'I would like to schedule an operational audit.',
        '',
        'Name: ' + d.full_name,
        'Email: ' + d.email,
        'Company: ' + d.company,
        'Company size: ' + d.company_size,
        'Main bottleneck: ' + d.bottleneck_label
      ];
      if (d.details) lines.push('Details: ' + d.details);
      if (d.calculator_result) lines.push('Calculator estimate: about ' + fmt(d.calculator_result.hours_saved_per_month) + ' hours a month and $' + fmt(d.calculator_result.cost_saved_per_year_usd) + ' a year');
      lines.push('', 'Thank you.');
      return lines.join('\n');
    }
    function linkFor(channel, d) {
      var text = message(d);
      if (channel === 'whatsapp') return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
      var subject = (d.request_type === 'consultation' ? 'Consultation request' : 'Operational audit request') + ': ' + d.company;
      return 'mailto:' + (CFG.contactEmail || '') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
    }
    function open(channel, url) {
      if (channel === 'whatsapp') {
        var w = window.open(url, '_blank');
        if (w) { try { w.opener = null; } catch (e) {} } else { location.href = url; }  // pop-up blocked: same tab
      } else {
        location.href = url;  // opens the visitor's email app
      }
    }
    function done(channel, url) {
      status.className = 'form-status is-good';
      status.innerHTML = '';
      var p = document.createElement('p');
      p.textContent = channel === 'whatsapp'
        ? 'WhatsApp is opening with your request written for you. Press Send in WhatsApp to deliver it to ImproFact.'
        : 'Your email app is opening with your request written for you. Press Send to deliver it to ImproFact.';
      var again = document.createElement('a');
      again.className = 'btn btn-ghost btn-sm';
      again.href = url;
      if (channel === 'whatsapp') { again.target = '_blank'; again.rel = 'noopener'; }
      again.textContent = channel === 'whatsapp' ? 'Didn’t open? Open WhatsApp' : 'Didn’t open? Open email';
      status.appendChild(p); status.appendChild(again);
      if (channel === 'email' && CFG.contactEmail) {
        var note = document.createElement('p');
        note.className = 'form-status-note';
        note.textContent = 'No email app? Write to ' + CFG.contactEmail + ' or use WhatsApp instead.';
        status.appendChild(note);
      }
    }
    function postWebhook(data) { // optional: also send a copy to a CRM / webhook when configured
      if (!CFG.webhookUrl) return;
      try {
        fetch(CFG.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), keepalive: true }).catch(function () {});
      } catch (e) {}
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var channel = (e.submitter && e.submitter.value) || lastChannel;
      // Spam: honeypot or implausibly fast submit → ignore silently
      if (f.hp.value || Date.now() - loadedAt < (CFG.minFillTimeMs || 2500)) return;
      var keys = Object.keys(rules), firstBad = null;
      keys.forEach(function (k) { f[k].dataset.touched = '1'; if (!check(k) && !firstBad) firstBad = f[k]; });
      if (firstBad) {
        status.className = 'form-status is-bad';
        status.textContent = 'Please check the highlighted fields.';
        firstBad.focus();
        track('form_error', { type: 'validation', field: firstBad.name });
        return;
      }
      var data = payload(); data.channel = channel;
      var url = linkFor(channel, data);
      open(channel, url);
      done(channel, url);
      postWebhook(data);
      track('form_submit', { request_type: data.request_type, bottleneck: data.bottleneck, channel: channel });
      track('generate_lead', { request_type: data.request_type, bottleneck: data.bottleneck, channel: channel });
    });
  })();

  /* ---------- Trust metrics count-up (only once figures are approved) ---------- */
  $$('[data-count]').forEach(function (el) {
    var to = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = fmt(to) + suf; return; }
    onceInView(el, function () {
      var t0 = performance.now();
      (function step(t) { var k = clamp((t - t0) / 1200, 0, 1); el.textContent = fmt(to * (1 - Math.pow(1 - k, 3))) + suf; if (k < 1) requestAnimationFrame(step); })(t0);
    }, 0.5);
  });
})();
