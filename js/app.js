// ============================================================
// POOKAL WHOLESALE — MAIN APP
// Bilingual (Tamil / English-Thanglish), onboarding, settings,
// routing, product cards, cart, checkout, order tracking
// ============================================================

(function () {
  'use strict';

  // ── Data refs ──────────────────────────────────────────
  const { FLOWERS, BOUQUETS, WEDDING_DECOR, CUSTOMIZATION_TYPES,
          COLOR_OPTIONS, DELIVERY_ESTIMATES } = window.ShopData;

  // ── DOM shorthand ──────────────────────────────────────
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  // ── App state ──────────────────────────────────────────
  let currentView = 'home';
  let prevView    = 'home';
  let searchOpen  = false;
  let toastTimer  = null;

  const customState = {
    selectedType: null,
    selectedFlowers: [],
    selectedColors: [],
    images: [],
  };

  let weddingBookingService = null;

  // ── Convenience: Lang.t() shortcut ────────────────────
  const t = key => window.Lang.t(key);

  // ══════════════════════════════════════════════════════
  // BOOT SEQUENCE
  // ══════════════════════════════════════════════════════
  window.addEventListener('DOMContentLoaded', () => {
    // Onboarding check
    if (!window.Lang.hasChosen()) {
      showOnboarding();
      return;
    }
    launchApp();
  });

  // ── Onboarding ─────────────────────────────────────────
  function showOnboarding() {
    const screen = $('onboarding-screen');
    screen.classList.remove('hidden');

    let chosenLang = 'ta';

    // Language buttons
    screen.querySelectorAll('[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        screen.querySelectorAll('[data-lang]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        chosenLang = btn.dataset.lang;
        // Live-update labels on the onboarding screen itself
        updateOnboardingLabels(chosenLang);
      });
    });

    $('ob-start-btn').addEventListener('click', () => {
      const name = $('ob-name-input').value.trim();
      if (!name) {
        $('ob-name-input').focus();
        $('ob-name-input').style.borderColor = 'var(--clr-primary)';
        return;
      }
      window.Lang.setName(name);
      window.Lang.set(chosenLang);
      screen.classList.add('hidden');
      launchApp();
    });
  }

  function updateOnboardingLabels(lang) {
    const isEn = lang === 'en';
    $('ob-title').textContent     = isEn ? 'Welcome to Pookal!' : 'பூக்கள் உலகிற்கு வரவேற்கிறோம்!';
    $('ob-sub').textContent       = isEn ? 'Fresh flowers direct from the farm' : 'நேரடி தோட்டத்திலிருந்து புதிய பூக்கள்';
    $('ob-name-label').textContent = isEn ? 'Your name' : 'உங்கள் பெயர்';
    $('ob-lang-label').textContent = isEn ? 'Choose language' : 'மொழி தேர்வு செய்யுங்கள்';
    $('ob-start-btn').textContent  = isEn ? "Let's start →" : 'தொடங்குவோம் →';
    $('ob-name-input').placeholder = isEn ? 'Enter your name' : 'பெயர் உள்ளிடுங்கள்';
  }

  // ── Full app launch ────────────────────────────────────
  function launchApp() {
    // Show loading briefly
    $('loading-screen').classList.remove('hidden');
    setTimeout(() => {
      $('loading-screen').classList.add('hidden');
      $('app').classList.remove('hidden');
      applyLanguageToPage();
      bindAll();
      renderAll();
      Cart.onChange(syncCartBadges);
      syncCartBadges();
      navigateTo('home');
    }, 900);
  }

  // ══════════════════════════════════════════════════════
  // LANGUAGE APPLICATION — updates every translatable node
  // ══════════════════════════════════════════════════════
  function applyLanguageToPage() {
    const lang = window.Lang;
    const isEn = lang.get() === 'en';
    const name = lang.getName() || (isEn ? 'Friend' : 'நண்பர்');

    // html lang attr
    document.documentElement.lang = isEn ? 'en' : 'ta';

    // Header
    $('header-brand-name').textContent  = 'பூக்கள்';
    $('header-brand-sub').textContent   = isEn ? 'Wholesale' : 'மொத்த விற்பனை';
    $('lang-toggle-label').textContent  = isEn ? 'தமி' : 'EN';

    // Loading
    $('loading-brand-name').textContent = 'பூக்கள்';

    // Drawer
    $('drawer-brand-name').textContent  = isEn ? 'Pookal Wholesale' : 'பூக்கள் மொத்த விற்பனை';
    $('drawer-greeting').textContent    = isEn
      ? `Hello, ${name}!`
      : `வணக்கம், ${name}!`;
    $('dnav-home').innerHTML    = `🏠 ${t('nav.home')}`;
    $('dnav-flowers').innerHTML = `🌸 ${t('nav.flowers')}`;
    $('dnav-bouquets').innerHTML= `💐 ${t('nav.bouquets')}`;
    $('dnav-wedding').innerHTML = `💒 ${t('nav.wedding')}`;
    $('dnav-custom').innerHTML  = `✨ ${t('nav.custom')}`;
    $('dnav-orders').innerHTML  = `📦 ${t('nav.orders')}`;
    $('dnav-settings').innerHTML= `⚙️ ${t('settings.title')}`;
    $('drawer-contact-title').textContent = t('nav.contact');
    $('drawer-hours').textContent = t('nav.hours');

    // Bottom nav
    $('bnav-home').textContent    = t('bnav.home');
    $('bnav-flowers').textContent = t('bnav.flowers');
    $('bnav-bouquets').textContent= t('bnav.bouquets');
    $('bnav-wedding').textContent = t('bnav.wedding');
    $('bnav-cart').textContent    = t('bnav.cart');

    // Home hero
    $('hero-badge').textContent   = t('home.hero.badge');
    $('hero-title').innerHTML     = t('home.hero.title').replace('\n', '<br/>');
    $('hero-sub').textContent     = t('home.hero.sub');
    $('hero-cta1').textContent    = t('home.hero.cta1');
    $('hero-cta2').textContent    = t('home.hero.cta2');

    // Delivery strip
    $('del-fast').textContent     = t('home.delivery.fast');
    $('del-fresh').textContent    = t('home.delivery.fresh');
    $('del-price').textContent    = t('home.delivery.price');

    // Category section
    $('home-cat-title').textContent = t('home.section.what');
    $('home-cat-sub').textContent   = t('home.section.choose');
    $('cat-flowers-name').textContent  = t('nav.flowers');
    $('cat-flowers-count').textContent = t('cat.flowers.count');
    $('cat-bouquets-name').textContent = t('nav.bouquets');
    $('cat-bouquets-count').textContent= t('cat.bouquets.count');
    $('cat-wedding-name').textContent  = t('nav.wedding');
    $('cat-wedding-count').textContent = t('cat.wedding.count');
    $('cat-custom-name').textContent   = t('nav.custom');
    $('cat-custom-count').textContent  = t('cat.custom.count');

    // Featured
    $('home-featured-title').textContent = t('home.section.today');
    $('home-see-all').textContent        = t('home.section.all');

    // Why us
    $('why-title').textContent       = t('home.why.title');
    $('why-farm').textContent        = t('home.why.farm');
    $('why-farm-text').textContent   = t('home.why.farm.text');
    $('why-fast').textContent        = t('home.why.fast');
    $('why-fast-text').textContent   = t('home.why.fast.text');
    $('why-price').textContent       = t('home.why.price');
    $('why-price-text').textContent  = t('home.why.price.text');
    $('why-wedding').textContent     = t('home.why.wedding');
    $('why-wedding-text').textContent= t('home.why.wedding.text');

    // Back buttons
    ['flowers-back','bouquets-back','wedding-back','custom-back',
     'cart-back-btn','checkout-back','orders-back','search-back',
     'settings-back'].forEach(id => {
       if ($(id)) $(id).textContent = t('nav.back');
    });

    // View titles
    $('flowers-view-title').textContent = t('nav.flowers');
    $('flowers-view-sub').textContent   = isEn ? 'Flowers · Wholesale' : 'மலர்கள் · மொத்த விற்பனை';
    $('bouquets-view-title').textContent= t('nav.bouquets');
    $('bouquets-view-sub').textContent  = isEn ? 'For all occasions' : 'அனைத்து சந்தர்ப்பங்களுக்கும்';
    $('wedding-view-title').textContent = t('nav.wedding');
    $('wedding-view-sub').textContent   = isEn ? 'Price on Request' : 'விலை கோரிக்கை';
    $('wedding-banner-text').textContent= t('wedding.banner');
    $('custom-view-title').textContent  = t('nav.custom');
    $('custom-view-sub').textContent    = isEn ? 'Your choice' : 'உங்கள் விருப்பம்';
    $('cart-view-title').textContent    = t('cart.title');
    $('checkout-view-title').textContent= isEn ? 'Checkout' : 'செக்அவுட்';
    $('orders-view-title').textContent  = t('orders.title');
    $('orders-view-sub').textContent    = isEn ? 'Track your orders' : 'உங்கள் ஆர்டர்கள்';
    $('search-view-title').textContent  = t('search.results');

    // Filter chips — Flowers
    $('ff-all').textContent  = t('filter.all');
    $('ff-avail').textContent= t('filter.available');
    $('ff-pop').textContent  = t('filter.popular');

    // Filter chips — Bouquets
    $('bf-all').textContent  = t('filter.all');
    $('bf-same').textContent = t('filter.sameday');

    // Customization form
    $('custom-intro-text').textContent  = t('custom.intro');
    $('lbl-custom-type').innerHTML      = `${t('custom.type.label')} <span class="req">*</span>`;
    $('lbl-custom-req').innerHTML       = `${t('custom.req.label')} <span class="req">*</span>`;
    $('custom-requirement').placeholder = t('custom.req.ph');
    $('lbl-flower-select').textContent  = t('custom.flower.label');
    $('lbl-color-select').textContent   = t('custom.color.label');
    $('lbl-budget').innerHTML           = `${t('custom.budget.label')} <span class="req">*</span>`;
    $('custom-budget').placeholder      = t('custom.budget.ph');
    $('lbl-date').innerHTML             = `${t('custom.date.label')} <span class="req">*</span>`;
    $('lbl-time').textContent           = t('custom.time.label');
    $('lbl-location').innerHTML         = `${t('custom.loc.label')} <span class="req">*</span>`;
    $('custom-location').placeholder    = t('custom.loc.ph');
    $('lbl-image').textContent          = t('custom.image.label');
    $('upload-text').textContent        = t('custom.image.text');
    $('upload-sub').textContent         = t('custom.image.sub');
    $('lbl-notes').textContent          = t('custom.notes.label');
    $('custom-notes').placeholder       = t('custom.notes.ph');
    $('custom-your-info').textContent   = t('custom.your.info');
    $('lbl-cname').innerHTML            = `${t('custom.name.label')} <span class="req">*</span>`;
    $('custom-name').placeholder        = t('custom.name.ph');
    $('lbl-cphone').innerHTML           = `${t('custom.phone.label')} <span class="req">*</span>`;
    $('custom-submit-btn').textContent  = t('custom.submit.btn');
    $('custom-success-title').textContent = t('custom.success.title');
    $('custom-success-msg').textContent   = t('custom.success.msg');
    $('custom-success-back').textContent  = t('custom.success.back');

    // Search placeholder
    $('search-input').placeholder = t('search.ph');

    // Settings view
    $('settings-view-title').textContent = t('settings.title');
    $('sg-hello').textContent            = t('settings.greeting');
    $('sg-name-display').textContent     = name + '!';
    $('set-name-title').textContent      = isEn ? 'Change Your Name' : 'உங்கள் பெயர் மாற்று';
    $('settings-name-input').placeholder = t('settings.name.ph');
    $('settings-name-input').value       = lang.getName();
    $('settings-name-save').textContent  = t('settings.save');
    $('set-lang-title').textContent      = t('settings.language');
    $('set-theme-title').textContent     = t('settings.theme');
    $('theme-dark-label').textContent    = isEn ? 'Dark' : 'இருண்ட தோற்றம்';
    $('theme-light-label').textContent   = isEn ? 'Light' : 'வெளிர் தோற்றம்';
    $('set-info-title').textContent      = t('settings.app.info');
    $('set-version').textContent         = t('settings.version');
    $('set-contact-label').textContent   = t('settings.contact');

    // Active state on settings lang/theme buttons
    const curLang  = lang.get();
    const curTheme = lang.getTheme();
    $$('[data-lang]').forEach(b => b.classList.toggle('active', b.dataset.lang === curLang));
    $$('[data-theme]').forEach(b => b.classList.toggle('active', b.dataset.theme === curTheme));
  }

  // ══════════════════════════════════════════════════════
  // BIND ALL EVENT LISTENERS
  // ══════════════════════════════════════════════════════
  function bindAll() {
    bindHeader();
    bindDrawer();
    bindBottomNav();
    bindSearchEvents();
    bindCartEvents();
    bindCustomizationForm();
    bindWeddingModal();
    bindFilterBars();
    bindSettings();
    bindGlobalDataViewClicks();
  }

  function bindGlobalDataViewClicks() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-view]');
      if (btn && !btn.closest('#side-drawer') && !btn.closest('#bottom-nav')) {
        e.preventDefault();
        const v = btn.dataset.view;
        if (v) navigateTo(v);
      }
    });
  }

  // ══════════════════════════════════════════════════════
  // INITIAL RENDER
  // ══════════════════════════════════════════════════════
  function renderAll() {
    renderFeaturedProducts();
    renderFlowerGrid();
    renderBouquetGrid();
    renderWeddingGrid();
    rebuildCustomizationChips();
  }

  // ══════════════════════════════════════════════════════
  // NAVIGATION
  // ══════════════════════════════════════════════════════
  function navigateTo(viewName) {
    $$('.view').forEach(v => v.classList.remove('active-view'));
    const target = $('view-' + viewName);
    if (!target) return;
    target.classList.add('active-view');
    document.documentElement.scrollTop = 0;

    $$('.bnav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === viewName));
    $$('.drawer-link').forEach(l => l.classList.toggle('active', l.dataset.view === viewName));

    prevView = currentView;
    currentView = viewName;

    if (viewName === 'cart')        renderCartView();
    if (viewName === 'orders')      renderOrdersView();
    if (viewName === 'checkout')    renderCheckoutView();

    if (viewName === 'customization') resetCustomizationIfDone();
  }

  // ══════════════════════════════════════════════════════
  // HEADER
  // ══════════════════════════════════════════════════════
  function bindHeader() {
    $('home-btn').addEventListener('click', () => navigateTo('home'));
    $('cart-btn').addEventListener('click', () => navigateTo('cart'));
    $('search-toggle-btn').addEventListener('click', toggleSearch);
    $('cart-back-btn').addEventListener('click', () => navigateTo(prevView || 'home'));

    // Language quick toggle
    $('lang-toggle-btn').addEventListener('click', () => {
      const newLang = window.Lang.get() === 'ta' ? 'en' : 'ta';
      window.Lang.set(newLang);
      applyLanguageToPage();
      // Re-render all grids with new language
      renderAll();
      if (currentView === 'cart')     renderCartView();
      if (currentView === 'orders')   renderOrdersView();
      if (currentView === 'checkout') renderCheckoutView();
      showToast(newLang === 'en' ? 'Language: English' : 'மொழி: தமிழ்');
    });
  }

  function toggleSearch() {
    searchOpen = !searchOpen;
    $('search-bar-wrap').classList.toggle('hidden', !searchOpen);
    if (searchOpen) $('search-input').focus();
  }

  // ══════════════════════════════════════════════════════
  // DRAWER
  // ══════════════════════════════════════════════════════
  function bindDrawer() {
    $('menu-btn').addEventListener('click', openDrawer);
    $('drawer-close').addEventListener('click', closeDrawer);
    $('drawer-overlay').addEventListener('click', closeDrawer);
    $$('#drawer-nav .drawer-link[data-view]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        closeDrawer();
        setTimeout(() => navigateTo(link.dataset.view), 220);
      });
    });
  }
  function openDrawer()  { $('side-drawer').setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
  function closeDrawer() { $('side-drawer').setAttribute('aria-hidden','true');  document.body.style.overflow=''; }

  // ══════════════════════════════════════════════════════
  // BOTTOM NAV
  // ══════════════════════════════════════════════════════
  function bindBottomNav() {
    $$('.bnav-btn').forEach(btn => {
      btn.addEventListener('click', () => { if (btn.dataset.view) navigateTo(btn.dataset.view); });
    });
  }

  // ══════════════════════════════════════════════════════
  // SETTINGS
  // ══════════════════════════════════════════════════════
  function bindSettings() {
    // Name save
    $('settings-name-save').addEventListener('click', () => {
      const name = $('settings-name-input').value.trim();
      if (!name) return;
      window.Lang.setName(name);
      applyLanguageToPage();
      showToast(t('settings.saved'));
    });

    // Language buttons in settings
    $$('#view-settings [data-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.Lang.set(btn.dataset.lang);
        applyLanguageToPage();
        renderAll();
        if (currentView === 'cart')   renderCartView();
        if (currentView === 'orders') renderOrdersView();
        showToast(btn.dataset.lang === 'en' ? 'Language: English' : 'மொழி: தமிழ்');
      });
    });

    // Theme buttons
    $$('#view-settings [data-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.Lang.setTheme(btn.dataset.theme);
        applyLanguageToPage();
        showToast(btn.dataset.theme === 'dark' ? '🌙 Dark theme' : '☀️ Light theme');
      });
    });
  }

  // ══════════════════════════════════════════════════════
  // FILTER BARS
  // ══════════════════════════════════════════════════════
  function bindFilterBars() {
    ['flower-filter-bar','bouquet-filter-bar'].forEach(barId => {
      const bar = $(barId);
      if (!bar) return;
      bar.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          bar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          if (barId === 'flower-filter-bar') filterFlowers(chip.dataset.filter);
          else filterBouquets(chip.dataset.filter);
        });
      });
    });
  }

  function filterFlowers(filter) {
    const grid = $('flowers-grid');
    grid.innerHTML = '';
    let list = FLOWERS;
    if (filter === 'available') list = FLOWERS.filter(f => f.availability && f.stock > 0);
    else if (filter === 'popular') list = FLOWERS.filter(f => f.badge === 'popular' || f.badge === 'bestseller');
    else if (filter === 'premium') list = FLOWERS.filter(f => f.badge === 'premium' || f.badge === 'rare');
    list.forEach(f => grid.appendChild(buildFlowerCard(f)));
  }

  function filterBouquets(filter) {
    const grid = $('bouquets-grid');
    grid.innerHTML = '';
    let list = BOUQUETS;
    if (filter === 'sameday') list = BOUQUETS.filter(b => b.sameDayDelivery);
    else if (filter === 'gift') list = BOUQUETS.filter(b => b.badge === 'gift' || b.badge === 'special');
    else if (filter === 'romantic') list = BOUQUETS.filter(b => b.badge === 'romantic');
    list.forEach(b => grid.appendChild(buildBouquetCard(b)));
  }

  // ══════════════════════════════════════════════════════
  // SEARCH
  // ══════════════════════════════════════════════════════
  function bindSearchEvents() {
    const input = $('search-input');
    $('search-clear').addEventListener('click', () => {
      input.value = '';
      toggleSearch();
      navigateTo('home');
    });
    input.addEventListener('input', debounce(() => {
      const q = input.value.trim();
      if (q.length >= 1) runSearch(q);
    }, 280));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && input.value.trim()) runSearch(input.value.trim());
    });
  }

  function runSearch(query) {
    const q = query.toLowerCase();
    const results = [];
    FLOWERS.forEach(p => { if (matchProduct(p, q)) results.push({ ...p, _type: 'flower' }); });
    BOUQUETS.forEach(p => { if (matchProduct(p, q)) results.push({ ...p, _type: 'bouquet' }); });
    WEDDING_DECOR.forEach(p => { if (matchProduct(p, q)) results.push({ ...p, _type: 'wedding' }); });

    const label = `"${query}" – ${results.length} ${t('nav.flowers').includes('மலர்') ? 'முடிவுகள்' : 'results'}`;
    $('search-results-label').textContent = label;
    const grid = $('search-results-grid');
    grid.innerHTML = '';

    if (results.length === 0) {
      grid.innerHTML = `<div style="padding:40px 16px;text-align:center;color:var(--clr-text-muted)">
        <div style="font-size:48px;margin-bottom:12px">🔍</div>
        <div style="font-size:16px;font-weight:700">${t('search.no.results')}</div>
        <div style="font-size:13px;margin-top:6px">${t('search.no.results.sub')}</div>
      </div>`;
    } else {
      results.forEach(item => {
        if (item._type === 'flower')  grid.appendChild(buildFlowerCard(item));
        else if (item._type === 'bouquet') grid.appendChild(buildBouquetCard(item));
        else grid.appendChild(buildWeddingCard(item));
      });
    }
    toggleSearch();
    navigateTo('search');
  }

  // Search across Tamil name, Thanglish name, formal English — case-insensitive
  function matchProduct(p, q) {
    return (
      (p.tamilName        && p.tamilName.toLowerCase().includes(q)) ||
      (p.thanglishName    && p.thanglishName.toLowerCase().includes(q)) ||
      (p.englishName      && p.englishName.toLowerCase().includes(q)) ||
      (p.description      && p.description.toLowerCase().includes(q)) ||
      (p.badge            && p.badge.toLowerCase().includes(q))
    );
  }

  // ══════════════════════════════════════════════════════
  // FEATURED PRODUCTS (Home)
  // ══════════════════════════════════════════════════════
  function renderFeaturedProducts() {
    const container = $('featured-products');
    if (!container) return;
    container.innerHTML = '';
    const featured = FLOWERS.filter(f => f.badge && f.availability).slice(0, 6);
    featured.forEach(flower => {
      const card = document.createElement('div');
      card.className = 'featured-card';
      const name = window.Lang.productName(flower);
      const unit = typeof flower.unit === 'object' ? flower.unit.english : flower.unit;
      card.innerHTML = `
        <div class="featured-img">
          <img src="${flower.image}" alt="${flower.imageAlt}" loading="lazy" />
        </div>
        <div class="featured-body">
          <div class="featured-name">${name}</div>
          <div class="featured-price">₹${flower.price} <span class="featured-unit">/ ${unit}</span></div>
          ${flower.badge ? `<div class="product-badge badge-${flower.badge}" style="position:relative;top:auto;left:auto;margin-top:6px;display:inline-block">${badgeLabel(flower.badge)}</div>` : ''}
        </div>`;
      card.addEventListener('click', () => navigateTo('flowers'));
      container.appendChild(card);
    });
  }

  // ══════════════════════════════════════════════════════
  // FLOWER CARDS
  // ══════════════════════════════════════════════════════
  function renderFlowerGrid() {
    const grid = $('flowers-grid');
    grid.innerHTML = '';
    FLOWERS.forEach(f => grid.appendChild(buildFlowerCard(f)));
  }

  function buildFlowerCard(flower) {
    const lang       = window.Lang;
    const isEn       = lang.get() === 'en';
    const name       = lang.productName(flower);
    // description: use descriptionEn in English mode if available
    const desc       = isEn ? (flower.descriptionEn || flower.description) : flower.description;
    const unit       = flower.unit; // always a plain string (kg / bundle / packet)
    const estLabel   = lang.deliveryLabel(flower.deliveryEstimate);

    const stockStatus = flower.stock <= 0 ? 'out' : flower.stock < 5 ? 'low' : 'ok';
    const stockLabel  = flower.stock <= 0 ? t('product.stock.out') :
                        flower.stock < 5  ? `${t('product.stock.low')} (${flower.stock} ${unit})` :
                        t('product.stock.ok');

    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = flower.id;

    // colors: use colorsEn in English mode
    const colorArr   = isEn ? (flower.colorsEn || flower.colors || []) : (flower.colors || []);
    const colorChips = colorArr.map(c => `<span class="meta-chip">🎨 ${c}</span>`).join('');

    card.innerHTML = `
      <div class="product-card-inner">
        <div class="product-img-wrap">
          <img src="${flower.image}" alt="${flower.imageAlt}" loading="lazy" />
          ${flower.badge ? `<span class="product-badge badge-${flower.badge}">${badgeLabel(flower.badge)}</span>` : ''}
        </div>
        <div class="product-body">
          <div class="product-name">${name}</div>
          <div class="product-desc">${desc}</div>
          <div class="product-price-row">
            <span class="product-price">₹${flower.price}</span>
            <span class="product-unit">/ ${unit}</span>
          </div>
          <div class="product-meta">
            <span class="meta-chip stock-${stockStatus}">${stockLabel}</span>
            <span class="meta-chip">⏱ ${estLabel}</span>
            <span class="meta-chip">${t('product.min.order')} ${flower.minimumQuantity} ${unit}</span>
          </div>
          ${colorChips ? `<div class="product-meta" style="margin-top:2px">${colorChips}</div>` : ''}
          <div class="product-order-row">
            <span class="qty-label">${t('product.qty.label')}</span>
            <div class="qty-wrap">
              <button class="qty-btn" data-action="dec" type="button">−</button>
              <input class="qty-input" type="number" value="${flower.minimumQuantity}"
                min="${flower.minimumQuantity}" step="${flower.minimumQuantity >= 1 ? 1 : 0.25}"
                aria-label="Quantity" />
              <button class="qty-btn" data-action="inc" type="button">+</button>
            </div>
            <button class="add-cart-btn" type="button"
              ${flower.stock <= 0 ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
              ${flower.stock <= 0 ? t('product.unavailable') : t('product.add.cart')}
            </button>
          </div>
        </div>
      </div>`;

    card.querySelector('[data-action="dec"]').addEventListener('click', () => {
      const inp  = card.querySelector('.qty-input');
      const step = parseFloat(inp.step) || 1;
      inp.value  = Math.max(parseFloat(inp.min) || 0, parseFloat(inp.value) - step).toFixed(step < 1 ? 2 : 0);
    });
    card.querySelector('[data-action="inc"]').addEventListener('click', () => {
      const inp  = card.querySelector('.qty-input');
      const step = parseFloat(inp.step) || 1;
      inp.value  = (parseFloat(inp.value) + step).toFixed(step < 1 ? 2 : 0);
    });
    card.querySelector('.add-cart-btn').addEventListener('click', () => {
      if (flower.stock <= 0) return;
      const qty = parseFloat(card.querySelector('.qty-input').value);
      if (!qty || qty < flower.minimumQuantity) {
        showToast(t('toast.min.qty').replace('{min}', flower.minimumQuantity).replace('{unit}', unit));
        return;
      }
      Cart.addItem({
        productId: flower.id, category: 'flowers',
        tamilName: name, englishName: flower.englishName,
        image: flower.image, price: flower.price,
        unit, quantity: qty,
        deliveryEstimate: flower.deliveryEstimate,
      });
      const btn = card.querySelector('.add-cart-btn');
      btn.textContent = t('product.added');
      btn.classList.add('added');
      setTimeout(() => { btn.textContent = t('product.add.cart'); btn.classList.remove('added'); }, 2000);
      showToast(t('toast.added.cart').replace('{name}', name));
    });
    return card;
  }

  // ══════════════════════════════════════════════════════
  // BOUQUET CARDS
  // ══════════════════════════════════════════════════════
  function renderBouquetGrid() {
    const grid = $('bouquets-grid');
    grid.innerHTML = '';
    BOUQUETS.forEach(b => grid.appendChild(buildBouquetCard(b)));
  }

  function buildBouquetCard(bouquet) {
    const lang     = window.Lang;
    const isEn     = lang.get() === 'en';
    const name     = lang.productName(bouquet);
    // description
    const desc     = isEn ? (bouquet.descriptionEn || bouquet.description) : bouquet.description;
    const sizeKeys = Object.keys(bouquet.sizes);
    const defaultS = bouquet.sizes[sizeKeys[0]];
    // preparationTime is now { ta, en } object
    const prepTime = isEn
      ? (bouquet.preparationTime?.en || bouquet.preparationTime || '45 mins')
      : (bouquet.preparationTime?.ta || bouquet.preparationTime || '45 நிமிடங்கள்');

    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = bouquet.id;
    card.dataset.selectedSize = sizeKeys[0];

    // size button labels: labelEn in English, labelTa in Tamil
    const sizeButtons = sizeKeys.map((k, i) => {
      const sz  = bouquet.sizes[k];
      const lbl = isEn ? (sz.labelEn || sz.labelTa || sz.label || k) : (sz.labelTa || sz.label || k);
      return `<button class="size-btn ${i === 0 ? 'active' : ''}" data-size="${k}" type="button">${lbl}</button>`;
    }).join('');

    card.innerHTML = `
      <div class="product-card-inner">
        <div class="product-img-wrap">
          <img src="${bouquet.image}" alt="${bouquet.imageAlt}" loading="lazy" />
          ${bouquet.badge ? `<span class="product-badge badge-${bouquet.badge}">${badgeLabel(bouquet.badge)}</span>` : ''}
        </div>
        <div class="product-body">
          <div class="product-name">${name}</div>
          <div class="product-desc">${bouquet.description}</div>
          <div class="size-selector" id="sizes-${bouquet.id}">${sizeButtons}</div>
          <div class="product-price-row">
            <span class="product-price" id="price-${bouquet.id}">₹${defaultS.price}</span>
            <span class="product-unit">/ ${isEn ? 'bouquet' : 'பூங்கொத்து'}</span>
          </div>
          <div class="product-meta">
            <span class="meta-chip stock-ok">${t('product.stock.ok')}</span>
            <span class="meta-chip">🕐 ${prepTime}</span>
            ${bouquet.sameDayDelivery ? `<span class="meta-chip" style="color:var(--clr-accent);border-color:rgba(255,217,61,0.3)">${t('product.sameday')}</span>` : ''}
          </div>
          <div class="product-order-row">
            <span class="qty-label">${t('product.count.label')}</span>
            <div class="qty-wrap">
              <button class="qty-btn" data-action="dec" type="button">−</button>
              <input class="qty-input" type="number" value="1" min="1" step="1" aria-label="Quantity" />
              <button class="qty-btn" data-action="inc" type="button">+</button>
            </div>
            <button class="add-cart-btn" type="button">${t('product.add.cart')}</button>
          </div>
        </div>
      </div>`;

    card.querySelector(`#sizes-${bouquet.id}`).addEventListener('click', e => {
      const btn = e.target.closest('.size-btn');
      if (!btn) return;
      card.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      card.dataset.selectedSize = btn.dataset.size;
      card.querySelector(`#price-${bouquet.id}`).textContent = '₹' + bouquet.sizes[btn.dataset.size].price;
    });
    card.querySelector('[data-action="dec"]').addEventListener('click', () => {
      const inp = card.querySelector('.qty-input');
      inp.value = Math.max(1, parseInt(inp.value) - 1);
    });
    card.querySelector('[data-action="inc"]').addEventListener('click', () => {
      const inp = card.querySelector('.qty-input');
      inp.value = parseInt(inp.value) + 1;
    });
    card.querySelector('.add-cart-btn').addEventListener('click', () => {
      const sizeKey  = card.dataset.selectedSize;
      const sizeData = bouquet.sizes[sizeKey];
      const qty      = parseInt(card.querySelector('.qty-input').value) || 1;
      const sizeLabel= isEn ? (sizeData.labelEn || sizeData.label) : (sizeData.labelTa || sizeData.label);
      Cart.addItem({
        productId: bouquet.id, category: 'bouquets',
        tamilName: name + ' (' + sizeLabel.split('(')[0].trim() + ')',
        englishName: bouquet.englishName,
        image: bouquet.image, price: sizeData.price,
        unit: isEn ? 'bouquet' : 'பூங்கொத்து',
        quantity: qty, size: sizeKey, sizeLabel,
        deliveryEstimate: 'sameday',
      });
      const btn = card.querySelector('.add-cart-btn');
      btn.textContent = t('product.added');
      btn.classList.add('added');
      setTimeout(() => { btn.textContent = t('product.add.cart'); btn.classList.remove('added'); }, 2000);
      showToast(t('toast.added.bouquet').replace('{name}', name));
    });
    return card;
  }

  // ══════════════════════════════════════════════════════
  // WEDDING DECOR CARDS
  // ══════════════════════════════════════════════════════
  function renderWeddingGrid() {
    const grid = $('wedding-grid');
    grid.innerHTML = '';
    WEDDING_DECOR.forEach(w => grid.appendChild(buildWeddingCard(w)));
  }

  function buildWeddingCard(service) {
    const lang     = window.Lang;
    const isEn     = lang.get() === 'en';
    const name     = lang.productName(service);
    const turnaround = isEn
      ? (service.turnaroundTime?.english || service.turnaroundTime || '')
      : (service.turnaroundTime?.tamil   || service.turnaroundTime || '');

    const servicesList = (service.services || []).map(s =>
      `<span class="service-tag">✦ ${typeof s === 'object' ? (isEn ? s.en : s.ta) : s}</span>`
    ).join('');

    const card = document.createElement('div');
    card.className = 'wedding-card';
    card.innerHTML = `
      <div class="wedding-card-img">
        <img src="${service.image}" alt="${service.imageAlt}" loading="lazy" />
        ${service.badge ? `<span class="product-badge badge-${service.badge}" style="position:absolute;top:10px;left:10px">${badgeLabel(service.badge)}</span>` : ''}
      </div>
      <div class="wedding-card-body">
        <div class="wedding-card-name">${name}</div>
        <div class="wedding-card-desc">${service.description}</div>
        <div class="wedding-card-services">${servicesList}</div>
        <div class="wedding-turnaround">📅 ${turnaround}</div>
        <div class="wedding-price-row">
          <div>
            <div class="wedding-starting">${t('wedding.starting')}</div>
            <div class="wedding-price-val">₹${service.startingPrice.toLocaleString('en-IN')}</div>
            <div class="wedding-price-note">${service.requiresQuote ? t('wedding.varies') : t('wedding.fixed')}</div>
          </div>
        </div>
        <div class="wedding-actions">
          <button class="btn btn-primary" data-service-id="${service.id}">${t('wedding.quote.btn')}</button>
          <button class="btn btn-ghost btn-sm" data-detail-id="${service.id}">${t('wedding.detail.btn')}</button>
        </div>
      </div>`;

    card.querySelector('[data-service-id]').addEventListener('click', () => openWeddingBookingModal(service));
    card.querySelector('[data-detail-id]').addEventListener('click', () => openWeddingDetailModal(service));
    return card;
  }

  // ══════════════════════════════════════════════════════
  // WEDDING BOOKING MODAL
  // ══════════════════════════════════════════════════════
  function bindWeddingModal() {
    $('wedding-modal-close').addEventListener('click', closeWeddingModal);
    $('wedding-booking-modal').addEventListener('click', e => {
      if (e.target === $('wedding-booking-modal')) closeWeddingModal();
    });
    $('product-modal-close').addEventListener('click', () => {
      $('product-modal').classList.add('hidden');
      document.body.style.overflow = '';
    });
  }

  function openWeddingBookingModal(service) {
    weddingBookingService = service;
    const isEn = window.Lang.get() === 'en';
    const name = window.Lang.productName(service);
    $('wedding-modal-title').textContent = name + ' – ' + t('wedding.modal.title');

    $('wedding-modal-body').innerHTML = `
      <div class="wedding-service-info">
        <div class="wedding-service-name">${name}</div>
        <div class="wedding-service-price">${t('wedding.modal.book.from')} ₹${service.startingPrice.toLocaleString('en-IN')}</div>
      </div>
      <form id="wedding-booking-form" class="wedding-booking-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="wb-name">${t('wedding.modal.name')} <span class="req">*</span></label>
          <input type="text" id="wb-name" class="form-input" placeholder="${t('custom.name.ph')}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="wb-phone">${t('wedding.modal.phone')} <span class="req">*</span></label>
          <input type="tel" id="wb-phone" class="form-input" placeholder="9876543210" maxlength="10" required />
        </div>
        <div class="form-row">
          <div class="form-group half">
            <label class="form-label" for="wb-date">${t('wedding.modal.date')} <span class="req">*</span></label>
            <input type="date" id="wb-date" class="form-input" required />
          </div>
          <div class="form-group half">
            <label class="form-label" for="wb-time">${t('wedding.modal.time')}</label>
            <input type="time" id="wb-time" class="form-input" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="wb-venue">${t('wedding.modal.venue')} <span class="req">*</span></label>
          <input type="text" id="wb-venue" class="form-input" placeholder="${t('wedding.modal.venue.ph')}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="wb-budget">${t('wedding.modal.budget')}</label>
          <input type="number" id="wb-budget" class="form-input" placeholder="${t('custom.budget.ph')}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="wb-notes">${t('wedding.modal.notes')}</label>
          <textarea id="wb-notes" class="form-textarea" rows="3" placeholder="${t('wedding.modal.notes.ph')}"></textarea>
        </div>
        <button type="submit" class="btn btn-primary btn-full">${t('wedding.modal.submit')}</button>
      </form>`;

    $('wedding-booking-form').addEventListener('submit', handleWeddingBookingSubmit);
    $('wedding-booking-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeWeddingModal() {
    $('wedding-booking-modal').classList.add('hidden');
    document.body.style.overflow = '';
  }

  function handleWeddingBookingSubmit(e) {
    e.preventDefault();
    const name  = $('wb-name').value.trim();
    const phone = $('wb-phone').value.trim();
    const date  = $('wb-date').value;
    const venue = $('wb-venue').value.trim();
    if (!name || !phone || !date || !venue) { showToast(t('toast.fill.required')); return; }
    if (phone.length !== 10) { showToast(t('toast.invalid.phone')); return; }
    const order = Orders.createWeddingRequest({
      name, phone, eventDate: date,
      eventTime: $('wb-time').value, venue,
      budget: $('wb-budget').value,
      notes: $('wb-notes').value,
    }, weddingBookingService);
    closeWeddingModal();
    showToast(t('wedding.received.toast') + ' ID: ' + order.id);
    setTimeout(() => navigateTo('orders'), 600);
  }

  function openWeddingDetailModal(service) {
    const name = window.Lang.productName(service);
    const isEn = window.Lang.get() === 'en';
    $('product-modal-title').textContent = name;
    const servicesList = (service.services || []).map(s =>
      `<li style="font-size:13px;color:var(--clr-text-muted);padding:6px 10px;background:var(--clr-surface);border-radius:8px;border:1px solid var(--clr-border)">
        ✦ ${typeof s === 'object' ? (isEn ? s.en : s.ta) : s}
      </li>`
    ).join('');
    const turnaround = isEn
      ? (service.turnaroundTime?.english || service.turnaroundTime || '')
      : (service.turnaroundTime?.tamil   || service.turnaroundTime || '');

    $('product-modal-body').innerHTML = `
      <img src="${service.image}" alt="${service.imageAlt}" style="border-radius:12px;margin-bottom:16px;height:200px;object-fit:cover" />
      <p style="font-size:14px;color:var(--clr-text-muted);line-height:1.7;margin-bottom:16px">${service.description}</p>
      <div style="font-size:14px;font-weight:700;margin-bottom:8px">${t('wedding.modal.services')}</div>
      <ul style="list-style:none;display:flex;flex-direction:column;gap:6px">${servicesList}</ul>
      <div style="margin-top:16px;padding:14px;background:var(--clr-surface);border-radius:12px;border:1px solid var(--clr-border)">
        <div style="font-size:12px;color:var(--clr-text-muted)">${t('wedding.starting')}</div>
        <div style="font-size:24px;font-weight:800;color:var(--clr-accent)">₹${service.startingPrice.toLocaleString('en-IN')}</div>
        <div style="font-size:11px;color:var(--clr-text-faint)">${service.requiresQuote ? t('wedding.varies') : t('wedding.fixed')}</div>
      </div>
      <div style="margin-top:12px" class="wedding-turnaround">📅 ${turnaround}</div>
      <button class="btn btn-primary btn-full" style="margin-top:16px" id="detail-book-btn">${t('wedding.quote.btn')}</button>`;

    $('detail-book-btn').addEventListener('click', () => {
      $('product-modal').classList.add('hidden');
      document.body.style.overflow = '';
      openWeddingBookingModal(service);
    });
    $('product-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  // ══════════════════════════════════════════════════════
  // CUSTOMIZATION FORM
  // ══════════════════════════════════════════════════════
  function bindCustomizationForm() {
    // These are rebuilt on language change via rebuildCustomizationChips()
    // Char counter
    $('custom-requirement').addEventListener('input', () => {
      $('req-char-count').textContent = $('custom-requirement').value.length;
    });
    // Image upload
    const uploadArea = $('upload-area');
    const fileInput  = $('custom-image');
    const previewRow = $('image-preview-row');
    uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', e => { e.preventDefault(); uploadArea.classList.remove('dragover'); handleImageFiles(Array.from(e.dataTransfer.files)); });
    fileInput.addEventListener('change', () => handleImageFiles(Array.from(fileInput.files)));

    function handleImageFiles(files) {
      files.forEach(file => {
        if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return;
        const reader = new FileReader();
        reader.onload = ev => {
          customState.images.push({ name: file.name, dataUrl: ev.target.result });
          const item = document.createElement('div');
          item.className = 'img-preview-item';
          item.innerHTML = `<img src="${ev.target.result}" alt="preview" /><button class="img-remove" type="button">✕</button>`;
          item.querySelector('.img-remove').addEventListener('click', () => {
            customState.images = customState.images.filter(i => i.name !== file.name);
            item.remove();
          });
          previewRow.appendChild(item);
        };
        reader.readAsDataURL(file);
      });
    }

    const today = new Date().toISOString().split('T')[0];
    $('custom-date').min = today;
    $('customization-form').addEventListener('submit', handleCustomSubmit);
  }

  function rebuildCustomizationChips() {
    const lang = window.Lang;
    const isEn = lang.get() === 'en';

    // Request type chips
    const typeContainer = $('custom-type-chips');
    typeContainer.innerHTML = '';
    CUSTOMIZATION_TYPES.forEach(ct => {
      const label = t('ctype.' + ct.id) || ct.label;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'type-chip' + (customState.selectedType === ct.id ? ' selected' : '');
      chip.dataset.id = ct.id;
      chip.innerHTML = `<span>${ct.icon}</span><span>${label}</span>`;
      chip.addEventListener('click', () => {
        typeContainer.querySelectorAll('.type-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        customState.selectedType = ct.id;
      });
      typeContainer.appendChild(chip);
    });

    // Flower chips
    const flowerContainer = $('flower-select-chips');
    flowerContainer.innerHTML = '';
    (window.FLOWER_OPTIONS_BILINGUAL || []).forEach(f => {
      const label = isEn ? f.en : f.ta;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'ms-chip' + (customState.selectedFlowers.includes(f.ta) ? ' selected' : '');
      chip.textContent = label;
      chip.addEventListener('click', () => {
        chip.classList.toggle('selected');
        const idx = customState.selectedFlowers.indexOf(f.ta);
        if (idx === -1) customState.selectedFlowers.push(f.ta);
        else customState.selectedFlowers.splice(idx, 1);
      });
      flowerContainer.appendChild(chip);
    });

    // Color chips
    const colorContainer = $('color-select-chips');
    colorContainer.innerHTML = '';
    COLOR_OPTIONS.forEach(c => {
      const colorLabel = t('color.' + c.value) || c.label;
      const wrap = document.createElement('div');
      wrap.className = 'color-chip' + (customState.selectedColors.includes(c.value) ? ' selected' : '');
      wrap.dataset.value = c.value;
      const dot = document.createElement('div');
      dot.className = 'color-dot';
      dot.style.background = c.hex;
      const lbl = document.createElement('span');
      lbl.className = 'color-chip-label';
      lbl.textContent = colorLabel;
      wrap.appendChild(dot); wrap.appendChild(lbl);
      wrap.addEventListener('click', () => {
        wrap.classList.toggle('selected');
        const idx = customState.selectedColors.indexOf(c.value);
        if (idx === -1) customState.selectedColors.push(c.value);
        else customState.selectedColors.splice(idx, 1);
      });
      colorContainer.appendChild(wrap);
    });
  }

  function handleCustomSubmit(e) {
    e.preventDefault();
    const requirement = $('custom-requirement').value.trim();
    const budget      = $('custom-budget').value;
    const date        = $('custom-date').value;
    const location    = $('custom-location').value.trim();
    const name        = $('custom-name').value.trim();
    const phone       = $('custom-phone').value.trim();
    if (!customState.selectedType)          { showToast(t('toast.select.type'));   return; }
    if (!requirement)                        { showToast(t('toast.fill.req'));      return; }
    if (!budget)                             { showToast(t('toast.fill.budget'));   return; }
    if (!date)                               { showToast(t('toast.fill.date'));     return; }
    if (!location)                           { showToast(t('toast.fill.location')); return; }
    if (!name)                               { showToast(t('toast.fill.name'));     return; }
    if (!phone || phone.length !== 10)       { showToast(t('toast.invalid.phone')); return; }
    const order = Orders.createCustomRequest({
      requestType: customState.selectedType, requirement,
      flowers: customState.selectedFlowers.join(', '),
      colors: customState.selectedColors.join(', '),
      budget, date, time: $('custom-time').value,
      location, notes: $('custom-notes').value,
      name, phone,
      imageCount: customState.images.length,
    });
    $('customization-form').classList.add('hidden');
    $('custom-success').classList.remove('hidden');
    $('custom-order-id').textContent = t('custom.req.id.prefix') + order.id;
    customState.selectedType = null;
    customState.selectedFlowers = [];
    customState.selectedColors = [];
    customState.images = [];
  }

  function resetCustomizationIfDone() {
    const form    = $('customization-form');
    const success = $('custom-success');
    if (form && success && !success.classList.contains('hidden')) {
      success.classList.add('hidden');
      form.classList.remove('hidden');
      form.reset();
      $$('.type-chip, .ms-chip').forEach(c => c.classList.remove('selected'));
      $$('.color-chip').forEach(c => c.classList.remove('selected'));
      $('image-preview-row').innerHTML = '';
      $('req-char-count').textContent = '0';
      customState.selectedType = null;
      customState.selectedFlowers = [];
      customState.selectedColors = [];
      customState.images = [];
    }
  }

  // ══════════════════════════════════════════════════════
  // CART VIEW
  // ══════════════════════════════════════════════════════
  function bindCartEvents() {
    Cart.onChange(() => { syncCartBadges(); if (currentView === 'cart') renderCartView(); });
  }

  function renderCartView() {
    const container = $('cart-content');
    const items     = Cart.getItems();
    const isEn      = window.Lang.get() === 'en';

    if (items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <div class="cart-empty-title">${t('cart.empty.title')}</div>
          <div class="cart-empty-sub">${t('cart.empty.sub')}</div>
          <button class="btn btn-primary" data-view="flowers">${t('cart.empty.btn')}</button>
        </div>`;
      return;
    }

    const delivLabel = id => {
      const est = DELIVERY_ESTIMATES.find(d => d.id === id);
      return est ? (isEn ? est.labelEn : est.label) : '';
    };

    const listHtml = items.map(item => `
      <div class="cart-item" data-cart-id="${item.cartId}">
        <div class="cart-item-img"><img src="${item.image}" alt="${item.tamilName}" /></div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.tamilName}</div>
          <div class="cart-item-sub">${item.sizeLabel || ''} ${item.unit ? '· ' + item.unit : ''}</div>
          <div class="cart-item-sub">${item.deliveryEstimate ? '⏱ ' + delivLabel(item.deliveryEstimate) : ''}</div>
          <div class="cart-item-price-row">
            <div class="cart-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            <div class="cart-item-actions">
              <div class="cart-qty-wrap">
                <button class="cart-qty-btn" data-cart-dec="${item.cartId}">−</button>
                <input class="cart-qty-input" type="number" value="${item.quantity}"
                  min="0.25" step="${item.quantity < 1 ? 0.25 : 1}"
                  data-cart-qty="${item.cartId}" aria-label="Quantity" />
                <button class="cart-qty-btn" data-cart-inc="${item.cartId}">+</button>
              </div>
              <button class="cart-remove" data-cart-remove="${item.cartId}" aria-label="Remove">🗑</button>
            </div>
          </div>
          <div style="font-size:12px;color:var(--clr-text-faint)">₹${item.price} × ${item.quantity} ${item.unit}</div>
        </div>
      </div>`).join('');

    const total = Cart.getTotal();
    const count = items.length;

    container.innerHTML = `
      <div class="cart-list">${listHtml}</div>
      <div class="cart-summary">
        <div class="summary-row"><span>${count} ${t('cart.items')}</span><span></span></div>
        <div class="summary-row"><span>${t('cart.subtotal')}</span><span>₹${total.toLocaleString('en-IN',{maximumFractionDigits:2})}</span></div>
        <div class="summary-row"><span>${t('cart.delivery')}</span><span style="color:var(--clr-green)">${t('cart.delivery.free')}</span></div>
        <div class="summary-row total"><span>${t('cart.total')}</span><span class="summary-val">₹${total.toLocaleString('en-IN',{maximumFractionDigits:2})}</span></div>
      </div>
      <div class="cart-checkout-wrap">
        <button class="btn btn-primary btn-full btn-lg" id="goto-checkout-btn">
          ${t('cart.checkout.btn')} ₹${total.toLocaleString('en-IN',{maximumFractionDigits:2})}
        </button>
      </div>`;

    container.querySelectorAll('[data-cart-dec]').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = container.querySelector(`[data-cart-qty="${btn.dataset.cartDec}"]`);
        Cart.updateQty(btn.dataset.cartDec, Math.max(0, parseFloat(inp.value) - (parseFloat(inp.step)||1)));
      });
    });
    container.querySelectorAll('[data-cart-inc]').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = container.querySelector(`[data-cart-qty="${btn.dataset.cartInc}"]`);
        Cart.updateQty(btn.dataset.cartInc, parseFloat(inp.value) + (parseFloat(inp.step)||1));
      });
    });
    container.querySelectorAll('[data-cart-qty]').forEach(inp => {
      inp.addEventListener('change', () => Cart.updateQty(inp.dataset.cartQty, parseFloat(inp.value)));
    });
    container.querySelectorAll('[data-cart-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm(t('cart.remove.confirm'))) Cart.removeItem(btn.dataset.cartRemove);
      });
    });
    $('goto-checkout-btn').addEventListener('click', () => navigateTo('checkout'));
  }

  // ══════════════════════════════════════════════════════
  // CHECKOUT VIEW
  // ══════════════════════════════════════════════════════
  function renderCheckoutView() {
    const container = $('checkout-content');
    const items     = Cart.getItems();
    if (items.length === 0) { navigateTo('cart'); return; }
    const total = Cart.getTotal();
    const today = new Date().toISOString().split('T')[0];
    const isEn  = window.Lang.get() === 'en';

    const orderItemsHtml = items.map(i =>
      `<div class="checkout-item">
        <span>${i.tamilName}${i.sizeLabel ? ' ('+i.sizeLabel.split('(')[0].trim()+')' : ''} × ${i.quantity}</span>
        <span>₹${(i.price*i.quantity).toLocaleString('en-IN',{maximumFractionDigits:2})}</span>
      </div>`
    ).join('');

    container.innerHTML = `
      <div class="checkout-wrap">
        <div class="checkout-section">
          <div class="checkout-section-title">${t('checkout.summary')}</div>
          <div class="checkout-order-summary">
            ${orderItemsHtml}
            <div class="checkout-total">
              <span>${t('checkout.total.label')}</span>
              <span>₹${total.toLocaleString('en-IN',{maximumFractionDigits:2})}</span>
            </div>
          </div>
        </div>
        <form id="checkout-form" novalidate>
          <div class="checkout-section">
            <div class="checkout-section-title">${t('checkout.delivery')}</div>
            <div class="form-group">
              <label class="form-label" for="co-name">${t('checkout.name.label')} <span class="req">*</span></label>
              <input type="text" id="co-name" class="form-input" placeholder="${t('checkout.name.ph')}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="co-phone">${t('checkout.phone.label')} <span class="req">*</span></label>
              <input type="tel" id="co-phone" class="form-input" placeholder="9876543210" maxlength="10" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="co-address">${t('checkout.addr.label')} <span class="req">*</span></label>
              <textarea id="co-address" class="form-textarea" rows="3" placeholder="${t('checkout.addr.ph')}" required></textarea>
            </div>
            <div class="form-row">
              <div class="form-group half">
                <label class="form-label" for="co-date">${t('checkout.date.label')} <span class="req">*</span></label>
                <input type="date" id="co-date" class="form-input" min="${today}" required />
              </div>
              <div class="form-group half">
                <label class="form-label" for="co-time">${t('checkout.time.label')}</label>
                <input type="time" id="co-time" class="form-input" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="co-notes">${t('checkout.notes.label')}</label>
              <textarea id="co-notes" class="form-textarea" rows="2" placeholder="${t('checkout.notes.ph')}"></textarea>
            </div>
          </div>
          <div class="checkout-section">
            <div class="checkout-section-title">${t('checkout.payment')}</div>
            <div style="display:flex;flex-direction:column;gap:10px">
              <label class="payment-option" style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--clr-card);border-radius:12px;border:1.5px solid var(--clr-primary);cursor:pointer">
                <input type="radio" name="payment" value="cod" checked style="accent-color:var(--clr-primary)" />
                <span style="font-size:22px">💵</span>
                <div>
                  <div style="font-weight:700;font-size:14px">${t('checkout.cod')}</div>
                  <div style="font-size:12px;color:var(--clr-text-muted)">${t('checkout.cod.sub')}</div>
                </div>
              </label>
              <label class="payment-option" style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--clr-card);border-radius:12px;border:1px solid var(--clr-border);cursor:pointer">
                <input type="radio" name="payment" value="upi" style="accent-color:var(--clr-primary)" />
                <span style="font-size:22px">📱</span>
                <div>
                  <div style="font-weight:700;font-size:14px">${t('checkout.upi')}</div>
                  <div style="font-size:12px;color:var(--clr-text-muted)">${t('checkout.upi.sub')}</div>
                </div>
              </label>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" style="margin-bottom:16px">
            ${t('checkout.place.btn')} – ₹${total.toLocaleString('en-IN',{maximumFractionDigits:2})}
          </button>
        </form>
      </div>`;

    $('checkout-form').addEventListener('submit', handleCheckoutSubmit);
  }

  function handleCheckoutSubmit(e) {
    e.preventDefault();
    const name    = $('co-name').value.trim();
    const phone   = $('co-phone').value.trim();
    const address = $('co-address').value.trim();
    const date    = $('co-date').value;
    const payment = document.querySelector('input[name="payment"]:checked')?.value || 'cod';
    if (!name)                        { showToast(t('toast.fill.name'));     return; }
    if (!phone || phone.length !== 10){ showToast(t('toast.invalid.phone')); return; }
    if (!address)                     { showToast(t('toast.fill.address'));  return; }
    if (!date)                        { showToast(t('toast.fill.del.date')); return; }
    const order = Orders.createOrder({
      cartItems: Cart.getItems(),
      customer: { name, phone, payment },
      deliveryInfo: { address, deliveryDate: date, deliveryTime: $('co-time').value, notes: $('co-notes').value },
      total: Cart.getTotal(),
    });
    Cart.clear();
    renderOrderSuccess(order);
    navigateTo('order-success');
  }

  // ══════════════════════════════════════════════════════
  // ORDER SUCCESS
  // ══════════════════════════════════════════════════════
  function renderOrderSuccess(order) {
    const container = $('order-success-content');
    const eta = order.eta || (window.Lang.get() === 'en' ? 'Within 2 hours' : '2 மணி நேரத்தில்');
    container.innerHTML = `
      <div class="order-success">
        <div class="order-success-emoji">🎉</div>
        <h1 class="order-success-title">${t('success.title')}</h1>
        <p class="order-success-sub">
          ${t('success.sub1')}<br/>
          <strong>${t('success.del.date')}</strong> ${order.delivery.deliveryDate || ''}<br/>
          <strong>${t('success.eta')}</strong> ${eta}
        </p>
        <div class="order-id-box">${t('success.order.id')}<strong>${order.id}</strong></div>
        <div class="order-success-actions">
          <button class="btn btn-primary" data-view="orders">${t('success.track.btn')}</button>
          <button class="btn btn-ghost" data-view="home">${t('success.home.btn')}</button>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════
  // ORDER TRACKING
  // ══════════════════════════════════════════════════════
  function renderOrdersView() {
    const container = $('orders-content');
    const orders    = Orders.getAll();
    const isEn      = window.Lang.get() === 'en';

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="orders-empty">
          <div class="orders-empty-icon">📦</div>
          <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">${t('orders.empty.title')}</h2>
          <p style="font-size:14px;color:var(--clr-text-muted);margin-bottom:24px">${t('orders.empty.sub')}</p>
          <button class="btn btn-primary" data-view="flowers">${t('orders.empty.btn')}</button>
        </div>`;
      return;
    }

    container.innerHTML = `<div class="orders-list">${orders.map(o => buildOrderCard(o, isEn)).join('')}</div>`;
    container.querySelectorAll('[data-order-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tl = container.querySelector(`[data-timeline="${btn.dataset.orderToggle}"]`);
        if (!tl) return;
        const isOpen = !tl.classList.contains('hidden');
        tl.classList.toggle('hidden', isOpen);
        btn.textContent = isOpen ? t('orders.show.status') : t('orders.hide.status');
      });
    });
  }

  function buildOrderCard(order, isEn) {
    const typeLabel = order.isCustom  ? t('orders.type.custom')
                    : order.isBooking ? t('orders.type.wedding')
                    : order.orderType === 'bouquets' ? t('orders.type.bouquets')
                    : t('orders.type.flowers');

    const itemsSummary = order.isCustom
      ? `${order.formData?.requirement?.slice(0, 60) || ''}…`
      : order.isBooking
      ? order.formData?.venue || ''
      : (order.items || []).map(i => `${i.tamilName} ×${i.quantity}`).join(', ');

    const totalDisplay = (order.isCustom || order.isBooking)
      ? order.quotation ? `₹${parseFloat(order.quotation.amount).toLocaleString('en-IN')}` : t('orders.pending.price')
      : `₹${(order.total||0).toLocaleString('en-IN',{maximumFractionDigits:0})}`;

    const timelineHtml = (order.timeline||[]).map(step => {
      const lbl = isEn ? (step.labelEn || step.label) : step.label;
      return `
        <div class="timeline-step ${step.state}">
          <div class="timeline-dot">${step.state === 'done' ? '✓' : step.icon || '●'}</div>
          <div class="timeline-label">${lbl}</div>
          ${step.time ? `<div class="timeline-time">${step.time}</div>` : ''}
        </div>`;
    }).join('');

    return `
      <div class="order-card">
        <div class="order-card-header">
          <div>
            <div style="font-size:13px;font-weight:700;margin-bottom:2px">${typeLabel}</div>
            <div class="order-id">${order.id}</div>
            <div class="order-date">${order.createdAt}</div>
          </div>
          <div class="order-total">${totalDisplay}</div>
        </div>
        <div class="order-card-body">
          <div class="order-items-preview">${itemsSummary}</div>
          <div class="order-eta">${t('orders.eta.label')} ${order.eta || ''}</div>
          <button class="btn btn-ghost btn-sm" data-order-toggle="${order.id}" style="margin-bottom:12px">
            ${t('orders.show.status')}
          </button>
          <div class="tracking-timeline hidden" data-timeline="${order.id}">
            ${timelineHtml}
          </div>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════
  // CART BADGE SYNC
  // ══════════════════════════════════════════════════════
  function syncCartBadges() {
    const count = Cart.getCount();
    [$('cart-count'), $('cart-count-nav')].forEach(el => {
      if (!el) return;
      el.textContent = count;
      el.classList.toggle('hidden', count === 0);
    });
  }

  // ══════════════════════════════════════════════════════
  // TOAST
  // ══════════════════════════════════════════════════════
  function showToast(msg, duration = 2800) {
    const toast = $('toast');
    $('toast-msg').textContent = msg;
    toast.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('hidden'), duration);
  }
  window.showToast = showToast;

  // ══════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════
  function badgeLabel(badge) {
    const MAP = {
      bestseller:'Best Seller', popular:'Popular', fresh:'Fresh',
      offer:'Offer', premium:'Premium', sacred:'Sacred', rare:'Rare',
      colorful:'Colorful', gift:'Gift', romantic:'Romantic',
      special:'Special', pure:'Pure', 'must-have':'Must Have', trending:'Trending',
    };
    return MAP[badge] || badge;
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

})();
