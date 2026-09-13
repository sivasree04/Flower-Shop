// ============================================================
// POOMALAR WHOLESALE — ADMIN DASHBOARD JS
// Full product management, order management, status updates
// ============================================================

(function () {
  'use strict';

  const { FLOWERS, BOUQUETS, WEDDING_DECOR, DELIVERY_ESTIMATES, ORDER_STATUSES } = window.ShopData;

  // Local mutable copies (admin can edit these in-session)
  let adminFlowers = JSON.parse(JSON.stringify(FLOWERS));
  let adminBouquets = JSON.parse(JSON.stringify(BOUQUETS));
  let adminWedding = JSON.parse(JSON.stringify(WEDDING_DECOR));

  const ADMIN_FLOWERS_KEY  = 'admin_flowers';
  const ADMIN_BOUQUETS_KEY = 'admin_bouquets';
  const ADMIN_WEDDING_KEY  = 'admin_wedding';

  // Load any admin overrides from localStorage
  function loadAdminData() {
    try {
      const af = localStorage.getItem(ADMIN_FLOWERS_KEY);
      const ab = localStorage.getItem(ADMIN_BOUQUETS_KEY);
      const aw = localStorage.getItem(ADMIN_WEDDING_KEY);
      if (af) adminFlowers = JSON.parse(af);
      if (ab) adminBouquets = JSON.parse(ab);
      if (aw) adminWedding = JSON.parse(aw);
    } catch { /* silent */ }
  }

  function saveAdminFlowers()  { localStorage.setItem(ADMIN_FLOWERS_KEY, JSON.stringify(adminFlowers)); }
  function saveAdminBouquets() { localStorage.setItem(ADMIN_BOUQUETS_KEY, JSON.stringify(adminBouquets)); }
  function saveAdminWedding()  { localStorage.setItem(ADMIN_WEDDING_KEY, JSON.stringify(adminWedding)); }

  // ── Helpers ────────────────────────────────────────────
  const $  = id  => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);
  let toastTimer = null;

  function showToast(msg, duration = 2800) {
    const t = $('admin-toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), duration);
  }

  function genId(prefix) {
    return prefix + Date.now().toString().slice(-6) + Math.random().toString(36).slice(2, 4).toUpperCase();
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ══════════════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', () => {
    loadAdminData();
    bindNav();
    bindMobileMenu();
    initDashboard();
    initOrdersPanel();
    initFlowersPanel();
    initBouquetsPanel();
    initWeddingPanel();
    initCustomPanel();
    initSettingsPanel();
    bindModal();
    $('dashboard-date').textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  });

  // ══════════════════════════════════════════════════════
  // NAVIGATION
  // ══════════════════════════════════════════════════════
  let currentPanel = 'dashboard';

  function bindNav() {
    $$('.admin-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = btn.dataset.panel;
        if (panel) switchPanel(panel);
        // Close mobile sidebar
        if (window.innerWidth <= 860) closeMobileSidebar();
      });
    });

    document.querySelectorAll('[data-panel]').forEach(el => {
      el.addEventListener('click', () => {
        const p = el.dataset.panel;
        if (p) switchPanel(p);
      });
    });
  }

  function switchPanel(name) {
    $$('.admin-panel').forEach(p => p.classList.remove('active-panel'));
    $$('.admin-nav-item').forEach(b => b.classList.toggle('active', b.dataset.panel === name));
    const panel = $('panel-' + name);
    if (panel) panel.classList.add('active-panel');
    currentPanel = name;

    const titles = {
      dashboard: 'Dashboard', orders: 'ஆர்டர்கள்',
      flowers: 'பூக்கள்', bouquets: 'பூங்கொத்து',
      wedding: 'திருமண சேவை', custom: 'தனிப்பயன் கோரிக்கை',
      settings: 'Settings',
    };
    $('admin-topbar-title').textContent = titles[name] || name;

    // Refresh on switch
    if (name === 'orders')   renderOrdersList();
    if (name === 'flowers')  renderFlowersList();
    if (name === 'bouquets') renderBouquetsList();
    if (name === 'wedding')  renderWeddingList();
    if (name === 'custom')   renderCustomRequests();
    if (name === 'dashboard') refreshDashboard();
  }

  // ── Mobile menu ────────────────────────────────────────
  function bindMobileMenu() {
    $('admin-menu-btn').addEventListener('click', () => {
      $('admin-sidebar').classList.toggle('open');
      $('admin-overlay').classList.toggle('hidden');
      document.body.style.overflow = $('admin-sidebar').classList.contains('open') ? 'hidden' : '';
    });
    $('admin-overlay').addEventListener('click', closeMobileSidebar);
  }

  function closeMobileSidebar() {
    $('admin-sidebar').classList.remove('open');
    $('admin-overlay').classList.add('hidden');
    document.body.style.overflow = '';
  }

  // ══════════════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════════════
  function initDashboard() {
    refreshDashboard();
  }

  function refreshDashboard() {
    const allOrders = Orders.getAll();
    const customOrders = allOrders.filter(o => o.isCustom);
    const activeOrders = allOrders.filter(o => o.status !== 'completed' && o.status !== 'delivered');
    const revenue = allOrders
      .filter(o => !o.isCustom && !o.isBooking && o.total)
      .reduce((s, o) => s + (o.total || 0), 0);

    $('stat-total-orders').textContent   = allOrders.length;
    $('stat-active-orders').textContent  = activeOrders.length;
    $('stat-revenue').textContent        = '₹' + revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    $('stat-custom-requests').textContent = customOrders.length;
    $('sidebar-order-count').textContent = activeOrders.length;

    // Recent orders (last 5)
    const recent = allOrders.slice(0, 5);
    const container = $('recent-orders-list');
    if (recent.length === 0) {
      container.innerHTML = `<div class="admin-empty"><div class="admin-empty-icon">📦</div><p>ஆர்டர்கள் இல்லை</p></div>`;
      return;
    }
    container.innerHTML = recent.map(o => buildOrderRowHtml(o)).join('');
    bindOrderRowEvents(container);
  }

  // ══════════════════════════════════════════════════════
  // ORDERS PANEL
  // ══════════════════════════════════════════════════════
  function initOrdersPanel() {
    renderOrdersList();
    $('orders-filter-type').addEventListener('change', renderOrdersList);
    $('orders-filter-status').addEventListener('change', renderOrdersList);
  }

  function renderOrdersList() {
    const typeFilter   = $('orders-filter-type').value;
    const statusFilter = $('orders-filter-status').value;
    let orders = Orders.getAll();

    if (typeFilter !== 'all') {
      orders = orders.filter(o => o.orderType === typeFilter);
    }
    if (statusFilter === 'active') {
      orders = orders.filter(o => o.status !== 'completed' && o.status !== 'delivered');
    } else if (statusFilter === 'completed') {
      orders = orders.filter(o => o.status === 'completed' || o.status === 'delivered');
    }

    const container = $('admin-orders-list');

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="section-card">
          <div class="admin-empty"><div class="admin-empty-icon">📦</div><p style="font-size:14px">ஆர்டர்கள் இல்லை</p></div>
        </div>`;
      return;
    }

    container.innerHTML = `<div class="section-card">${orders.map(o => buildOrderRowHtml(o)).join('')}</div>`;
    bindOrderRowEvents(container);
  }

  function buildOrderRowHtml(order) {
    const typeLabel = order.isCustom   ? '✨ தனிப்பயன்'
                    : order.isBooking  ? '💒 திருமண கோரிக்கை'
                    : order.orderType === 'bouquets' ? '💐 பூங்கொத்து'
                    : order.orderType === 'flowers'  ? '🌸 பூக்கள்'
                    : '📦 ஆர்டர்';

    const isCompleted = order.status === 'completed' || order.status === 'delivered';
    const pillClass = order.isCustom || order.isBooking ? 'sp-received'
                    : isCompleted ? 'sp-completed' : 'sp-active';
    const pillLabel = isCompleted ? '✓ முடிந்தது'
                    : order.isCustom || order.isBooking ? '⏳ நிலுவையில்'
                    : '🔄 செயலில்';

    const customerName = order.customer?.name || order.formData?.name || '—';
    const customerPhone = order.customer?.phone || order.formData?.phone || '';

    const itemsSummary = order.isCustom
      ? `${order.formData?.requirement?.slice(0, 60) || ''}…`
      : order.isBooking
      ? `சேவை: ${order.service?.tamilName || ''} · ${order.formData?.venue || ''}`
      : (order.items || []).map(i => `${i.tamilName} ×${i.quantity}`).join(', ');

    const totalDisplay = (order.isCustom || order.isBooking)
      ? order.quotation ? `₹${parseFloat(order.quotation.amount).toLocaleString('en-IN')}` : 'நிலுவையில்'
      : `₹${(order.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    const totalClass = (!order.total && (order.isCustom || order.isBooking)) ? 'aor-total pending' : 'aor-total';

    const currentStep = (order.timeline || []).find(s => s.state === 'active');
    const stepLabel = currentStep ? currentStep.label : (isCompleted ? 'முடிந்தது' : '—');

    return `
      <div class="admin-order-row" data-order-id="${order.id}">
        <div class="aor-left">
          <div class="aor-id">${order.id}</div>
          <div class="aor-type">${typeLabel}</div>
          <div class="aor-customer">${escHtml(customerName)} ${customerPhone ? '· ' + customerPhone : ''}</div>
          <div class="aor-items">${escHtml(itemsSummary)}</div>
          <div class="aor-date">${order.createdAt}</div>
          <div style="margin-top:6px">
            <span class="status-pill ${pillClass}">${pillLabel}</span>
            <span style="font-size:11px;color:var(--a-text-faint);margin-left:8px">${escHtml(stepLabel)}</span>
          </div>
          <div class="aor-actions">
            <button class="btn-admin-ghost" data-view-order="${order.id}">📋 விவரங்கள்</button>
            ${!isCompleted ? `<button class="btn-admin-green" data-advance-order="${order.id}">▶ அடுத்த நிலை</button>` : ''}
            ${(order.isCustom || order.isBooking) && !order.quotation
              ? `<button class="btn-admin-accent" data-quote-order="${order.id}">₹ விலை அனுப்பு</button>`
              : order.quotation
              ? `<span style="font-size:12px;color:var(--a-accent)">₹ மதிப்பீடு: ${order.quotation.amount}</span>`
              : ''}
          </div>
        </div>
        <div class="aor-right">
          <div class="${totalClass}">${escHtml(totalDisplay)}</div>
        </div>
      </div>`;
  }

  function bindOrderRowEvents(container) {
    container.querySelectorAll('[data-view-order]').forEach(btn => {
      btn.addEventListener('click', () => openOrderDetail(btn.dataset.viewOrder));
    });
    container.querySelectorAll('[data-advance-order]').forEach(btn => {
      btn.addEventListener('click', () => advanceOrder(btn.dataset.advanceOrder));
    });
    container.querySelectorAll('[data-quote-order]').forEach(btn => {
      btn.addEventListener('click', () => openQuotationModal(btn.dataset.quoteOrder));
    });
  }

  function advanceOrder(orderId) {
    const updated = Orders.advanceStatus(orderId);
    if (!updated) return;
    const step = updated.timeline.find(s => s.state === 'active') ||
                 updated.timeline[updated.timeline.length - 1];
    showToast(`ஆர்டர் ${orderId}: ${step.label}`);
    renderOrdersList();
    refreshDashboard();
  }

  // ── Order Detail Modal ─────────────────────────────────
  function openOrderDetail(orderId) {
    const order = Orders.getById(orderId);
    if (!order) return;

    const isCustom  = order.isCustom;
    const isBooking = order.isBooking;

    let detailHtml = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <div class="detail-chip">🆔 ${order.id}</div>
          <div class="detail-chip">📅 ${order.createdAt}</div>
        </div>`;

    // Customer info
    const name    = order.customer?.name || order.formData?.name || '—';
    const phone   = order.customer?.phone || order.formData?.phone || '—';
    const address = order.delivery?.address || order.formData?.venue || order.formData?.location || '—';
    const delDate = order.delivery?.deliveryDate || order.formData?.eventDate || '—';

    detailHtml += `
        <div style="background:var(--a-surface);border-radius:12px;padding:14px;border:1px solid var(--a-border)">
          <div style="font-weight:700;margin-bottom:10px">👤 வாடிக்கையாளர் தகவல்</div>
          <div style="font-size:13px;color:var(--a-text-muted);display:flex;flex-direction:column;gap:6px">
            <div>பெயர்: <strong style="color:var(--a-text)">${escHtml(name)}</strong></div>
            <div>மொபைல்: <strong style="color:var(--a-text)">${escHtml(phone)}</strong></div>
            <div>முகவரி: <strong style="color:var(--a-text)">${escHtml(address)}</strong></div>
            <div>தேதி: <strong style="color:var(--a-text)">${escHtml(delDate)}</strong></div>
            ${order.delivery?.deliveryTime ? `<div>நேரம்: <strong style="color:var(--a-text)">${escHtml(order.delivery.deliveryTime)}</strong></div>` : ''}
          </div>
        </div>`;

    // Items / service / request
    if (!isCustom && !isBooking && order.items) {
      detailHtml += `
        <div style="background:var(--a-surface);border-radius:12px;padding:14px;border:1px solid var(--a-border)">
          <div style="font-weight:700;margin-bottom:10px">🛒 ஆர்டர் பொருட்கள்</div>
          ${order.items.map(i => `
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--a-border);font-size:13px">
              <span>${escHtml(i.tamilName)} ${i.sizeLabel ? '(' + i.sizeLabel + ')' : ''} × ${i.quantity} ${i.unit}</span>
              <span style="color:var(--a-primary)">₹${(i.price * i.quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>`).join('')}
          <div style="display:flex;justify-content:space-between;padding-top:10px;font-weight:800;font-size:16px">
            <span>மொத்தம்</span><span style="color:var(--a-primary)">₹${(order.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          <div style="font-size:12px;color:var(--a-text-muted);margin-top:6px">கட்டண முறை: ${escHtml(order.customer?.payment || 'COD')}</div>
        </div>`;
    }

    if (isCustom) {
      const f = order.formData || {};
      detailHtml += `
        <div style="background:var(--a-surface);border-radius:12px;padding:14px;border:1px solid var(--a-border)">
          <div style="font-weight:700;margin-bottom:10px">✨ கோரிக்கை விவரங்கள்</div>
          <div style="font-size:13px;color:var(--a-text-muted);display:flex;flex-direction:column;gap:8px">
            <div>வகை: <strong style="color:var(--a-text)">${escHtml(f.requestType || '')}</strong></div>
            <div>தேவை: <strong style="color:var(--a-text)">${escHtml(f.requirement || '')}</strong></div>
            ${f.flowers ? `<div>பூக்கள்: <strong style="color:var(--a-text)">${escHtml(f.flowers)}</strong></div>` : ''}
            ${f.colors  ? `<div>நிறங்கள்: <strong style="color:var(--a-text)">${escHtml(f.colors)}</strong></div>` : ''}
            <div>பட்ஜெட்: <strong style="color:var(--a-accent)">₹${escHtml(f.budget || '')}</strong></div>
            ${f.notes   ? `<div>குறிப்பு: <strong style="color:var(--a-text)">${escHtml(f.notes)}</strong></div>` : ''}
            ${f.imageCount ? `<div>📷 படங்கள்: ${f.imageCount}</div>` : ''}
          </div>
        </div>`;
    }

    if (isBooking) {
      const f = order.formData || {};
      detailHtml += `
        <div style="background:var(--a-surface);border-radius:12px;padding:14px;border:1px solid var(--a-border)">
          <div style="font-weight:700;margin-bottom:10px">💒 கோரிக்கை விவரங்கள்</div>
          <div style="font-size:13px;color:var(--a-text-muted);display:flex;flex-direction:column;gap:8px">
            <div>சேவை: <strong style="color:var(--a-text)">${escHtml(order.service?.tamilName || '')}</strong></div>
            <div>தொடக்க விலை: <strong style="color:var(--a-accent)">₹${(order.service?.startingPrice || 0).toLocaleString('en-IN')}</strong></div>
            <div>மண்டபம்: <strong style="color:var(--a-text)">${escHtml(f.venue || '')}</strong></div>
            ${f.budget ? `<div>பட்ஜெட்: <strong style="color:var(--a-accent)">₹${escHtml(f.budget)}</strong></div>` : ''}
            ${f.notes  ? `<div>குறிப்பு: <strong style="color:var(--a-text)">${escHtml(f.notes)}</strong></div>` : ''}
          </div>
        </div>`;
    }

    // Quotation (if sent)
    if (order.quotation) {
      detailHtml += `
        <div style="background:rgba(255,217,61,0.08);border-radius:12px;padding:14px;border:1px solid rgba(255,217,61,0.25)">
          <div style="font-weight:700;margin-bottom:8px;color:var(--a-accent)">₹ மதிப்பீடு அனுப்பப்பட்டது</div>
          <div style="font-size:22px;font-weight:800;color:var(--a-accent)">₹${parseFloat(order.quotation.amount).toLocaleString('en-IN')}</div>
          ${order.quotation.notes ? `<div style="font-size:13px;color:var(--a-text-muted);margin-top:6px">${escHtml(order.quotation.notes)}</div>` : ''}
          <div style="font-size:11px;color:var(--a-text-faint);margin-top:4px">${order.quotation.sentAt}</div>
        </div>`;
    }

    // Timeline
    detailHtml += `
        <div style="background:var(--a-surface);border-radius:12px;padding:16px;border:1px solid var(--a-border)">
          <div style="font-weight:700;margin-bottom:16px">📍 ஆர்டர் நிலை</div>
          <div class="admin-timeline">
            ${(order.timeline || []).map(step => `
              <div class="atl-step ${step.state}">
                <div class="atl-dot">${step.state === 'done' ? '✓' : step.icon || '●'}</div>
                <div>
                  <div class="atl-label">${escHtml(step.label)}</div>
                  ${step.time ? `<div class="atl-time">${escHtml(step.time)}</div>` : ''}
                </div>
              </div>`).join('')}
          </div>
        </div>`;

    // Set next status manually
    const isCompleted = order.status === 'completed' || order.status === 'delivered';
    if (!isCompleted) {
      const steps = ORDER_STATUSES[order.orderType] || ORDER_STATUSES.flowers;
      detailHtml += `
        <div>
          <label class="admin-label">நிலை மாற்று</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <select class="admin-select" id="manual-status-select" style="flex:1">
              ${steps.map(s => `<option value="${s.id}" ${order.status === s.id ? 'selected' : ''}>${s.icon} ${s.label}</option>`).join('')}
            </select>
            <button class="btn-admin-primary" id="apply-status-btn" data-order-id="${order.id}">நிலை மாற்று</button>
          </div>
        </div>`;
    }

    detailHtml += `</div>`;

    // Inject inline styles for admin-timeline
    detailHtml += `
      <style>
        .admin-timeline { position:relative; padding-left:28px; }
        .admin-timeline::before { content:''; position:absolute; left:9px; top:0; bottom:0; width:2px; background:var(--a-border); }
        .atl-step { position:relative; padding-bottom:14px; display:flex; gap:10px; align-items:flex-start; }
        .atl-step:last-child { padding-bottom:0; }
        .atl-dot { position:absolute; left:-20px; top:2px; width:20px; height:20px; border-radius:50%; background:var(--a-card); border:2px solid var(--a-border); display:flex; align-items:center; justify-content:center; font-size:9px; z-index:1; flex-shrink:0; }
        .atl-step.done .atl-dot { background:var(--a-green); border-color:var(--a-green); color:#111; }
        .atl-step.active .atl-dot { background:var(--a-primary); border-color:var(--a-primary); }
        .atl-label { font-size:13px; font-weight:600; color:var(--a-text-faint); }
        .atl-step.done .atl-label { color:var(--a-green); }
        .atl-step.active .atl-label { color:var(--a-text); font-weight:700; }
        .atl-time { font-size:11px; color:var(--a-text-faint); font-family:var(--font-en); }
        .detail-chip { display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:999px; background:var(--a-surface); border:1px solid var(--a-border); font-size:12px; color:var(--a-text-muted); }
      </style>`;

    openModal('ஆர்டர் விவரங்கள்: ' + order.id, detailHtml);

    // Bind status apply
    setTimeout(() => {
      const applyBtn = $('apply-status-btn');
      if (applyBtn) {
        applyBtn.addEventListener('click', () => {
          const stepId = $('manual-status-select').value;
          const oid    = applyBtn.dataset.orderId;
          Orders.setStatus(oid, stepId);
          showToast('நிலை புதுப்பிக்கப்பட்டது');
          closeModal();
          renderOrdersList();
          refreshDashboard();
        });
      }
    }, 100);
  }

  // ── Quotation Modal ────────────────────────────────────
  function openQuotationModal(orderId) {
    const order = Orders.getById(orderId);
    if (!order) return;

    const body = `
      <div style="margin-bottom:14px">
        <div style="font-size:14px;color:var(--a-text-muted);margin-bottom:4px">ஆர்டர்: <strong style="color:var(--a-text)">${order.id}</strong></div>
        <div style="font-size:13px;color:var(--a-text-muted)">
          வாடிக்கையாளர்: ${escHtml(order.formData?.name || order.customer?.name || '—')}
          ${order.formData?.budget ? `· பட்ஜெட்: ₹${order.formData.budget}` : ''}
        </div>
      </div>
      <div class="admin-form">
        <div class="admin-form-group">
          <label class="admin-label">மதிப்பீட்டு தொகை (₹) *</label>
          <input type="number" class="admin-input" id="quote-amount" placeholder="உ.கா: 8500" min="0" />
        </div>
        <div class="admin-form-group">
          <label class="admin-label">குறிப்புகள்</label>
          <textarea class="admin-textarea" id="quote-notes" rows="3"
            placeholder="அடங்கிய சேவைகள், நிபந்தனைகள்…"></textarea>
        </div>
        <button class="btn-admin-accent" id="send-quote-btn" data-order-id="${order.id}">
          ₹ மதிப்பீடு அனுப்பு
        </button>
      </div>`;

    openModal('மதிப்பீடு அனுப்பு', body);

    setTimeout(() => {
      $('send-quote-btn').addEventListener('click', () => {
        const amount = $('quote-amount').value;
        const notes  = $('quote-notes').value;
        if (!amount) { showToast('தொகை உள்ளிடவும்'); return; }
        Orders.addQuotation(orderId, amount, notes);
        Orders.setStatus(orderId, 'quotation_sent');
        showToast(`மதிப்பீடு ${orderId} க்கு அனுப்பப்பட்டது`);
        closeModal();
        renderOrdersList();
        refreshDashboard();
      });
    }, 100);
  }

  // ══════════════════════════════════════════════════════
  // FLOWERS PANEL
  // ══════════════════════════════════════════════════════
  function initFlowersPanel() {
    renderFlowersList();
    $('add-flower-btn').addEventListener('click', () => openFlowerForm(null));
  }

  function renderFlowersList() {
    const container = $('flowers-admin-list');
    if (adminFlowers.length === 0) {
      container.innerHTML = `<div class="section-card"><div class="admin-empty"><div class="admin-empty-icon">🌸</div><p>பூக்கள் இல்லை</p></div></div>`;
      return;
    }
    container.innerHTML = adminFlowers.map(f => buildProductCardHtml(f, 'flower')).join('');
    bindProductCardEvents(container, 'flower');
  }

  function buildProductCardHtml(product, type) {
    const stockStatus = product.stock <= 0 ? 'red' : product.stock < 5 ? 'orange' : 'green';
    const stockLabel  = product.stock <= 0 ? `❌ கிடையாது` : `✅ ${product.stock} ${product.stockUnit || product.unit}`;
    const estLabel    = (DELIVERY_ESTIMATES.find(d => d.id === product.deliveryEstimate) || {}).label || product.deliveryEstimate;
    const avail       = product.availability !== false;

    return `
      <div class="admin-product-card" data-id="${product.id}" data-type="${type}">
        <div class="apc-img">
          <img src="${product.image}" alt="${escHtml(product.tamilName)}" loading="lazy" />
        </div>
        <div class="apc-body">
          <div class="apc-name">${escHtml(product.tamilName)}</div>
          <div class="apc-name-en">${escHtml(product.englishName || '')}</div>
          <div class="apc-meta">
            <span class="apc-chip">₹${product.price} / ${product.unit}</span>
            <span class="apc-chip ${stockStatus}">${stockLabel}</span>
            <span class="apc-chip">⏱ ${escHtml(estLabel)}</span>
            <span class="apc-chip">📦 கு. ${product.minimumQuantity} ${product.unit}</span>
            <span class="apc-chip ${avail ? 'green' : 'red'}">${avail ? '🟢 Available' : '🔴 Unavailable'}</span>
          </div>
          <div class="apc-actions">
            <button class="btn-admin-primary" data-edit="${product.id}" data-type="${type}">✏️ திருத்து</button>
            <button class="btn-admin-ghost" data-toggle="${product.id}" data-type="${type}">
              ${avail ? '🔴 கிடைக்கவில்லை' : '🟢 கிடைக்கும்'}
            </button>
            <button class="btn-danger" data-delete="${product.id}" data-type="${type}">🗑 நீக்கு</button>
          </div>
        </div>
      </div>`;
  }

  function bindProductCardEvents(container, type) {
    container.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.edit;
        if (type === 'flower')  openFlowerForm(id);
        if (type === 'bouquet') openBouquetForm(id);
        if (type === 'wedding') openWeddingForm(id);
      });
    });
    container.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => toggleProductAvailability(btn.dataset.toggle, type));
    });
    container.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('இந்த பொருளை நீக்கவா?')) deleteProduct(btn.dataset.delete, type);
      });
    });
  }

  function toggleProductAvailability(id, type) {
    const list = type === 'flower' ? adminFlowers : type === 'bouquet' ? adminBouquets : adminWedding;
    const item = list.find(p => p.id === id);
    if (!item) return;
    item.availability = !item.availability;
    if (type === 'flower')  saveAdminFlowers();
    if (type === 'bouquet') saveAdminBouquets();
    if (type === 'wedding') saveAdminWedding();
    showToast(`${item.tamilName} ${item.availability ? 'கிடைக்கும்' : 'கிடைக்கவில்லை'}`);
    if (type === 'flower')  renderFlowersList();
    if (type === 'bouquet') renderBouquetsList();
    if (type === 'wedding') renderWeddingList();
  }

  function deleteProduct(id, type) {
    if (type === 'flower') {
      adminFlowers = adminFlowers.filter(p => p.id !== id); saveAdminFlowers(); renderFlowersList();
    } else if (type === 'bouquet') {
      adminBouquets = adminBouquets.filter(p => p.id !== id); saveAdminBouquets(); renderBouquetsList();
    } else if (type === 'wedding') {
      adminWedding = adminWedding.filter(p => p.id !== id); saveAdminWedding(); renderWeddingList();
    }
    showToast('நீக்கப்பட்டது');
  }

  // ── Flower Form ────────────────────────────────────────
  function openFlowerForm(id) {
    const isNew  = !id;
    const flower = isNew ? {} : adminFlowers.find(f => f.id === id) || {};

    const body = `
      <form id="flower-form" class="admin-form" novalidate>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-label">தமிழ் பெயர் *</label>
            <input class="admin-input" name="tamilName" value="${escHtml(flower.tamilName || '')}" placeholder="ரோஜா" required />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">English Name</label>
            <input class="admin-input" name="englishName" value="${escHtml(flower.englishName || '')}" placeholder="Rose" />
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-label">விளக்கம்</label>
          <textarea class="admin-textarea" name="description" rows="2">${escHtml(flower.description || '')}</textarea>
        </div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-label">விலை (₹) *</label>
            <input class="admin-input" type="number" name="price" value="${flower.price || ''}" placeholder="350" required />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">அலகு *</label>
            <select class="admin-select" name="unit">
              <option value="kg" ${flower.unit === 'kg' ? 'selected' : ''}>kg</option>
              <option value="bundle" ${flower.unit === 'bundle' ? 'selected' : ''}>bundle</option>
              <option value="packet" ${flower.unit === 'packet' ? 'selected' : ''}>packet</option>
              <option value="piece" ${flower.unit === 'piece' ? 'selected' : ''}>piece</option>
            </select>
          </div>
        </div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-label">குறைந்தது அளவு</label>
            <input class="admin-input" type="number" name="minimumQuantity" value="${flower.minimumQuantity || 1}" step="0.25" />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">கையிருப்பு</label>
            <input class="admin-input" type="number" name="stock" value="${flower.stock || 0}" />
          </div>
        </div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-label">வழங்கல் நேரம்</label>
            <select class="admin-select" name="deliveryEstimate">
              ${DELIVERY_ESTIMATES.map(d => `<option value="${d.id}" ${flower.deliveryEstimate === d.id ? 'selected' : ''}>${d.label}</option>`).join('')}
            </select>
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Badge</label>
            <select class="admin-select" name="badge">
              <option value="">None</option>
              ${['bestseller','popular','fresh','offer','premium','sacred','rare','colorful'].map(b =>
                `<option value="${b}" ${flower.badge === b ? 'selected' : ''}>${b}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-label">படம் URL</label>
          <input class="admin-input" name="image" value="${escHtml(flower.image || '')}" placeholder="https://..." />
        </div>
        <div class="toggle-row">
          <div><div class="toggle-label">கிடைக்கும்?</div></div>
          <label class="toggle-switch">
            <input type="checkbox" name="availability" ${flower.availability !== false ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div style="display:flex;gap:10px;margin-top:8px">
          <button type="submit" class="btn-admin-primary">${isNew ? '+ சேர்' : '✓ சேமி'}</button>
          <button type="button" class="btn-admin-ghost" id="cancel-form-btn">ரத்து</button>
        </div>
      </form>`;

    openModal(isNew ? '🌸 புதிய பூ சேர்' : '✏️ பூ திருத்து', body);

    setTimeout(() => {
      $('cancel-form-btn').addEventListener('click', closeModal);
      $('flower-form').addEventListener('submit', e => {
        e.preventDefault();
        const data = getFormData('flower-form');
        if (!data.tamilName || !data.price) { showToast('தேவையான தகவல்கள் நிரப்பவும்'); return; }

        if (isNew) {
          adminFlowers.push({
            id: genId('fl-'), category: 'flowers',
            tamilName: data.tamilName, englishName: data.englishName,
            description: data.description, price: parseFloat(data.price),
            unit: data.unit, minimumQuantity: parseFloat(data.minimumQuantity || 1),
            stock: parseFloat(data.stock || 0), stockUnit: data.unit,
            deliveryEstimate: data.deliveryEstimate, badge: data.badge || null,
            image: data.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
            imageAlt: data.tamilName, availability: data.availability,
          });
        } else {
          const idx = adminFlowers.findIndex(f => f.id === id);
          if (idx > -1) Object.assign(adminFlowers[idx], {
            tamilName: data.tamilName, englishName: data.englishName,
            description: data.description, price: parseFloat(data.price),
            unit: data.unit, minimumQuantity: parseFloat(data.minimumQuantity || 1),
            stock: parseFloat(data.stock || 0),
            deliveryEstimate: data.deliveryEstimate, badge: data.badge || null,
            image: data.image || adminFlowers[idx].image,
            availability: data.availability,
          });
        }
        saveAdminFlowers();
        showToast(isNew ? 'புதிய பூ சேர்க்கப்பட்டது' : 'தகவல் சேமிக்கப்பட்டது');
        closeModal();
        renderFlowersList();
      });
    }, 100);
  }

  // ══════════════════════════════════════════════════════
  // BOUQUETS PANEL
  // ══════════════════════════════════════════════════════
  function initBouquetsPanel() {
    renderBouquetsList();
    $('add-bouquet-btn').addEventListener('click', () => openBouquetForm(null));
  }

  function renderBouquetsList() {
    const container = $('bouquets-admin-list');
    if (adminBouquets.length === 0) {
      container.innerHTML = `<div class="section-card"><div class="admin-empty"><div class="admin-empty-icon">💐</div><p>பூங்கொத்து இல்லை</p></div></div>`;
      return;
    }
    container.innerHTML = adminBouquets.map(b => {
      const minPrice = Math.min(...Object.values(b.sizes).map(s => s.price));
      const maxPrice = Math.max(...Object.values(b.sizes).map(s => s.price));
      const avail = b.availability !== false;
      return `
        <div class="admin-product-card" data-id="${b.id}" data-type="bouquet">
          <div class="apc-img">
            <img src="${b.image}" alt="${escHtml(b.tamilName)}" loading="lazy" />
          </div>
          <div class="apc-body">
            <div class="apc-name">${escHtml(b.tamilName)}</div>
            <div class="apc-name-en">${escHtml(b.englishName || '')}</div>
            <div class="apc-meta">
              <span class="apc-chip">₹${minPrice}–₹${maxPrice}</span>
              <span class="apc-chip">🕐 ${escHtml(b.preparationTime)}</span>
              ${b.sameDayDelivery ? '<span class="apc-chip green">⚡ இன்றே</span>' : ''}
              <span class="apc-chip ${avail ? 'green' : 'red'}">${avail ? '🟢 Available' : '🔴 Unavailable'}</span>
            </div>
            <div class="apc-meta" style="margin-top:2px">
              ${Object.values(b.sizes).map(s => `<span class="apc-chip">${escHtml(s.label.split('(')[0].trim())} ₹${s.price}</span>`).join('')}
            </div>
            <div class="apc-actions">
              <button class="btn-admin-primary" data-edit="${b.id}" data-type="bouquet">✏️ திருத்து</button>
              <button class="btn-admin-ghost" data-toggle="${b.id}" data-type="bouquet">${avail ? '🔴 Unavailable' : '🟢 Available'}</button>
              <button class="btn-danger" data-delete="${b.id}" data-type="bouquet">🗑 நீக்கு</button>
            </div>
          </div>
        </div>`;
    }).join('');
    bindProductCardEvents(container, 'bouquet');
  }

  function openBouquetForm(id) {
    const isNew = !id;
    const bq = isNew ? { sizes: { small: { label: 'சிறியது', price: 300, flowers: 12 }, medium: { label: 'நடுத்தரம்', price: 550, flowers: 24 }, large: { label: 'பெரியது', price: 1000, flowers: 50 } } }
                     : adminBouquets.find(b => b.id === id) || {};

    const sizeHtml = ['small', 'medium', 'large'].map(sk => {
      const s = (bq.sizes || {})[sk] || {};
      return `
        <div style="background:var(--a-surface);border-radius:10px;padding:12px;border:1px solid var(--a-border);margin-bottom:10px">
          <div style="font-weight:700;font-size:13px;margin-bottom:8px;text-transform:capitalize">${sk}</div>
          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-label">Label</label>
              <input class="admin-input" name="size_${sk}_label" value="${escHtml(s.label || '')}" placeholder="சிறியது" />
            </div>
            <div class="admin-form-group">
              <label class="admin-label">விலை (₹)</label>
              <input class="admin-input" type="number" name="size_${sk}_price" value="${s.price || ''}" placeholder="300" />
            </div>
            <div class="admin-form-group">
              <label class="admin-label">பூக்கள் எண்ணிக்கை</label>
              <input class="admin-input" type="number" name="size_${sk}_flowers" value="${s.flowers || ''}" placeholder="12" />
            </div>
          </div>
        </div>`;
    }).join('');

    const body = `
      <form id="bouquet-form" class="admin-form" novalidate>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-label">தமிழ் பெயர் *</label>
            <input class="admin-input" name="tamilName" value="${escHtml(bq.tamilName || '')}" required />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">English Name</label>
            <input class="admin-input" name="englishName" value="${escHtml(bq.englishName || '')}" />
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-label">விளக்கம்</label>
          <textarea class="admin-textarea" name="description" rows="2">${escHtml(bq.description || '')}</textarea>
        </div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-label">தயாரிப்பு நேரம் *</label>
            <input class="admin-input" name="preparationTime" value="${escHtml(bq.preparationTime || '')}" placeholder="45 நிமிடங்கள்" />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Badge</label>
            <select class="admin-select" name="badge">
              <option value="">None</option>
              ${['bestseller','popular','gift','romantic','special','pure','must-have','trending'].map(b =>
                `<option value="${b}" ${bq.badge === b ? 'selected' : ''}>${b}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="font-weight:700;font-size:14px;margin:4px 0 8px">அளவு & விலை</div>
        ${sizeHtml}
        <div class="admin-form-row">
          <div class="toggle-row" style="flex:1">
            <div><div class="toggle-label">இன்றே வழங்கல்?</div></div>
            <label class="toggle-switch">
              <input type="checkbox" name="sameDayDelivery" ${bq.sameDayDelivery ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="toggle-row" style="flex:1">
            <div><div class="toggle-label">கிடைக்கும்?</div></div>
            <label class="toggle-switch">
              <input type="checkbox" name="availability" ${bq.availability !== false ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-label">படம் URL</label>
          <input class="admin-input" name="image" value="${escHtml(bq.image || '')}" placeholder="https://..." />
        </div>
        <div style="display:flex;gap:10px;margin-top:8px">
          <button type="submit" class="btn-admin-primary">${isNew ? '+ சேர்' : '✓ சேமி'}</button>
          <button type="button" class="btn-admin-ghost" id="cancel-form-btn">ரத்து</button>
        </div>
      </form>`;

    openModal(isNew ? '💐 புதிய பூங்கொத்து' : '✏️ பூங்கொத்து திருத்து', body);

    setTimeout(() => {
      $('cancel-form-btn').addEventListener('click', closeModal);
      $('bouquet-form').addEventListener('submit', e => {
        e.preventDefault();
        const data = getFormData('bouquet-form');
        if (!data.tamilName) { showToast('பெயர் உள்ளிடவும்'); return; }
        const sizes = {
          small:  { label: data.size_small_label  || 'சிறியது',    price: parseFloat(data.size_small_price  || 300), flowers: parseInt(data.size_small_flowers  || 12) },
          medium: { label: data.size_medium_label || 'நடுத்தரம்', price: parseFloat(data.size_medium_price || 550), flowers: parseInt(data.size_medium_flowers || 24) },
          large:  { label: data.size_large_label  || 'பெரியது',   price: parseFloat(data.size_large_price  || 1000), flowers: parseInt(data.size_large_flowers  || 50) },
        };
        const entry = {
          tamilName: data.tamilName, englishName: data.englishName,
          description: data.description, sizes,
          preparationTime: data.preparationTime,
          sameDayDelivery: data.sameDayDelivery,
          badge: data.badge || null, availability: data.availability,
          image: data.image || 'https://images.unsplash.com/photo-1487530811015-780c972a428c?w=400&q=80',
          imageAlt: data.tamilName, unit: 'bouquet', minimumQuantity: 1, category: 'bouquets',
        };
        if (isNew) {
          adminBouquets.push({ id: genId('bq-'), ...entry });
        } else {
          const idx = adminBouquets.findIndex(b => b.id === id);
          if (idx > -1) Object.assign(adminBouquets[idx], entry);
        }
        saveAdminBouquets();
        showToast(isNew ? 'புதிய பூங்கொத்து சேர்க்கப்பட்டது' : 'சேமிக்கப்பட்டது');
        closeModal();
        renderBouquetsList();
      });
    }, 100);
  }

  // ══════════════════════════════════════════════════════
  // WEDDING PANEL
  // ══════════════════════════════════════════════════════
  function initWeddingPanel() {
    renderWeddingList();
    $('add-wedding-btn').addEventListener('click', () => openWeddingForm(null));
  }

  function renderWeddingList() {
    const container = $('wedding-admin-list');
    if (adminWedding.length === 0) {
      container.innerHTML = `<div class="section-card"><div class="admin-empty"><div class="admin-empty-icon">💒</div><p>சேவைகள் இல்லை</p></div></div>`;
      return;
    }
    container.innerHTML = adminWedding.map(w => {
      const avail = w.availability !== false;
      return `
        <div class="admin-product-card" data-id="${w.id}" data-type="wedding">
          <div class="apc-img">
            <img src="${w.image}" alt="${escHtml(w.tamilName)}" loading="lazy" />
          </div>
          <div class="apc-body">
            <div class="apc-name">${escHtml(w.tamilName)}</div>
            <div class="apc-name-en">${escHtml(w.englishName || '')}</div>
            <div class="apc-meta">
              <span class="apc-chip">₹${w.startingPrice.toLocaleString('en-IN')} முதல்</span>
              ${w.requiresQuote ? '<span class="apc-chip orange">கோரிக்கை</span>' : '<span class="apc-chip green">நிலையான விலை</span>'}
              <span class="apc-chip ${avail ? 'green' : 'red'}">${avail ? '🟢 Available' : '🔴 Unavailable'}</span>
            </div>
            <div class="apc-actions">
              <button class="btn-admin-primary" data-edit="${w.id}" data-type="wedding">✏️ திருத்து</button>
              <button class="btn-admin-ghost" data-toggle="${w.id}" data-type="wedding">${avail ? '🔴 Unavailable' : '🟢 Available'}</button>
              <button class="btn-danger" data-delete="${w.id}" data-type="wedding">🗑 நீக்கு</button>
            </div>
          </div>
        </div>`;
    }).join('');
    bindProductCardEvents(container, 'wedding');
  }

  function openWeddingForm(id) {
    const isNew = !id;
    const w = isNew ? {} : adminWedding.find(x => x.id === id) || {};

    const body = `
      <form id="wedding-form" class="admin-form" novalidate>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-label">தமிழ் பெயர் *</label>
            <input class="admin-input" name="tamilName" value="${escHtml(w.tamilName || '')}" required />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">English Name</label>
            <input class="admin-input" name="englishName" value="${escHtml(w.englishName || '')}" />
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-label">விளக்கம்</label>
          <textarea class="admin-textarea" name="description" rows="3">${escHtml(w.description || '')}</textarea>
        </div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-label">தொடக்க விலை (₹) *</label>
            <input class="admin-input" type="number" name="startingPrice" value="${w.startingPrice || ''}" required />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">அலகு</label>
            <input class="admin-input" name="unit" value="${escHtml(w.unit || 'per event')}" />
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-label">சேவைகள் (ஒவ்வொன்றும் புதிய வரியில்)</label>
          <textarea class="admin-textarea" name="services" rows="4">${(w.services || []).join('\n')}</textarea>
        </div>
        <div class="admin-form-group">
          <label class="admin-label">நேர மதிப்பீடு</label>
          <input class="admin-input" name="turnaroundTime" value="${escHtml(w.turnaroundTime || '')}" placeholder="நிகழ்வுக்கு 1 நாள் முன்பு" />
        </div>
        <div class="toggle-row">
          <div><div class="toggle-label">விலை கோரிக்கை தேவையா?</div><div class="toggle-sub">Fixed price or quotation</div></div>
          <label class="toggle-switch">
            <input type="checkbox" name="requiresQuote" ${w.requiresQuote ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="toggle-row">
          <div><div class="toggle-label">கிடைக்கும்?</div></div>
          <label class="toggle-switch">
            <input type="checkbox" name="availability" ${w.availability !== false ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="admin-form-group" style="margin-top:8px">
          <label class="admin-label">படம் URL</label>
          <input class="admin-input" name="image" value="${escHtml(w.image || '')}" placeholder="https://..." />
        </div>
        <div style="display:flex;gap:10px;margin-top:8px">
          <button type="submit" class="btn-admin-primary">${isNew ? '+ சேர்' : '✓ சேமி'}</button>
          <button type="button" class="btn-admin-ghost" id="cancel-form-btn">ரத்து</button>
        </div>
      </form>`;

    openModal(isNew ? '💒 புதிய சேவை' : '✏️ சேவை திருத்து', body);

    setTimeout(() => {
      $('cancel-form-btn').addEventListener('click', closeModal);
      $('wedding-form').addEventListener('submit', e => {
        e.preventDefault();
        const data = getFormData('wedding-form');
        if (!data.tamilName || !data.startingPrice) { showToast('தேவையான தகவல்கள் நிரப்பவும்'); return; }
        const services = (data.services || '').split('\n').map(s => s.trim()).filter(Boolean);
        const entry = {
          tamilName: data.tamilName, englishName: data.englishName,
          description: data.description, startingPrice: parseFloat(data.startingPrice),
          unit: data.unit || 'per event', services,
          turnaroundTime: data.turnaroundTime,
          requiresQuote: data.requiresQuote,
          availability: data.availability,
          image: data.image || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80',
          imageAlt: data.tamilName, badge: w.badge || null, category: 'weddingDecor',
        };
        if (isNew) {
          adminWedding.push({ id: genId('wd-'), ...entry });
        } else {
          const idx = adminWedding.findIndex(x => x.id === id);
          if (idx > -1) Object.assign(adminWedding[idx], entry);
        }
        saveAdminWedding();
        showToast(isNew ? 'புதிய சேவை சேர்க்கப்பட்டது' : 'சேமிக்கப்பட்டது');
        closeModal();
        renderWeddingList();
      });
    }, 100);
  }

  // ══════════════════════════════════════════════════════
  // CUSTOM REQUESTS PANEL
  // ══════════════════════════════════════════════════════
  function initCustomPanel() {
    renderCustomRequests();
  }

  function renderCustomRequests() {
    const container = $('custom-requests-list');
    const all = Orders.getAll().filter(o => o.isCustom || o.isBooking);
    $('custom-req-count').textContent = all.length + ' கோரிக்கைகள்';

    if (all.length === 0) {
      container.innerHTML = `<div class="section-card"><div class="admin-empty"><div class="admin-empty-icon">✨</div><p style="font-size:14px">தனிப்பயன் கோரிக்கைகள் இல்லை</p></div></div>`;
      return;
    }

    container.innerHTML = all.map(order => {
      const isCustom = order.isCustom;
      const f = order.formData || {};
      const step = (order.timeline || []).find(s => s.state === 'active');
      const isCompleted = order.status === 'completed';

      const rows = isCustom ? [
        ['வகை', f.requestType || '—'],
        ['தேவை', f.requirement || '—'],
        ['பூக்கள்', f.flowers || '—'],
        ['நிறங்கள்', f.colors || '—'],
        ['பட்ஜெட்', f.budget ? '₹' + f.budget : '—'],
        ['தேதி', f.date || '—'],
        ['இடம்', f.location || '—'],
        ['படங்கள்', f.imageCount ? f.imageCount + ' படங்கள்' : '—'],
        ['குறிப்பு', f.notes || '—'],
      ] : [
        ['சேவை', order.service?.tamilName || '—'],
        ['மண்டபம்', f.venue || '—'],
        ['தேதி', f.eventDate || '—'],
        ['பட்ஜெட்', f.budget ? '₹' + f.budget : '—'],
        ['குறிப்பு', f.notes || '—'],
      ];

      return `
        <div class="custom-req-card">
          <div class="crc-header">
            <div>
              <div class="crc-id">${order.id}</div>
              <div class="crc-date">${order.createdAt}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
              <span class="status-pill sp-received">${isCustom ? '✨ தனிப்பயன்' : '💒 திருமண கோரிக்கை'}</span>
              ${step ? `<span style="font-size:11px;color:var(--a-text-faint)">${escHtml(step.label)}</span>` : ''}
            </div>
          </div>
          <div class="crc-body">
            <div class="crc-row"><span class="crc-label">வாடிக்கையாளர்</span><span class="crc-val"><strong>${escHtml(f.name || '—')}</strong> · ${escHtml(f.phone || '—')}</span></div>
            ${rows.filter(r => r[1] && r[1] !== '—').map(r => `
              <div class="crc-row">
                <span class="crc-label">${escHtml(r[0])}</span>
                <span class="crc-val">${escHtml(r[1])}</span>
              </div>`).join('')}
            ${order.quotation ? `
              <div style="margin-top:8px;padding:10px;background:rgba(255,217,61,0.08);border-radius:8px;border:1px solid rgba(255,217,61,0.25)">
                <div style="font-size:12px;color:var(--a-accent);font-weight:700">₹ மதிப்பீடு: ₹${parseFloat(order.quotation.amount).toLocaleString('en-IN')}</div>
                ${order.quotation.notes ? `<div style="font-size:12px;color:var(--a-text-muted);margin-top:4px">${escHtml(order.quotation.notes)}</div>` : ''}
              </div>` : ''}
          </div>
          <div class="crc-actions">
            <button class="btn-admin-primary" data-view-order="${order.id}">📋 விவரங்கள்</button>
            ${!isCompleted ? `<button class="btn-admin-green" data-advance-order="${order.id}">▶ அடுத்த நிலை</button>` : ''}
            ${!order.quotation ? `<button class="btn-admin-accent" data-quote-order="${order.id}">₹ விலை அனுப்பு</button>` : ''}
          </div>
        </div>`;
    }).join('');

    container.querySelectorAll('[data-view-order]').forEach(btn => {
      btn.addEventListener('click', () => openOrderDetail(btn.dataset.viewOrder));
    });
    container.querySelectorAll('[data-advance-order]').forEach(btn => {
      btn.addEventListener('click', () => { advanceOrder(btn.dataset.advanceOrder); renderCustomRequests(); });
    });
    container.querySelectorAll('[data-quote-order]').forEach(btn => {
      btn.addEventListener('click', () => openQuotationModal(btn.dataset.quoteOrder));
    });
  }

  // ══════════════════════════════════════════════════════
  // SETTINGS PANEL
  // ══════════════════════════════════════════════════════
  function initSettingsPanel() {
    // Delivery time settings
    const deliContainer = $('delivery-settings-form');
    deliContainer.innerHTML = DELIVERY_ESTIMATES.map(d => `
      <div class="toggle-row">
        <div>
          <div class="toggle-label">${d.label}</div>
          <div class="toggle-sub">${d.labelEn}</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" checked />
          <span class="toggle-slider"></span>
        </label>
      </div>`).join('');

    // Shop info
    const shopContainer = $('shop-info-form');
    const { SHOP_CONFIG } = window.ShopData;
    shopContainer.innerHTML = `
      <div class="admin-form">
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-label">திறப்பு நேரம்</label>
            <input class="admin-input" type="time" value="${SHOP_CONFIG.openTime}" id="setting-open" />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">மூடும் நேரம்</label>
            <input class="admin-input" type="time" value="${SHOP_CONFIG.closeTime}" id="setting-close" />
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-label">தொலைபேசி</label>
          <input class="admin-input" type="tel" value="${SHOP_CONFIG.phone}" id="setting-phone" />
        </div>
        <div class="admin-form-group">
          <label class="admin-label">முகவரி</label>
          <textarea class="admin-textarea" id="setting-address" rows="2">${SHOP_CONFIG.address}</textarea>
        </div>
        <div class="admin-form-group">
          <label class="admin-label">வழங்கல் சுற்றளவு</label>
          <input class="admin-input" value="${SHOP_CONFIG.deliveryRadius}" id="setting-radius" />
        </div>
        <button class="btn-admin-primary" id="save-shop-settings">✓ சேமி</button>
      </div>`;

    $('save-shop-settings').addEventListener('click', () => {
      showToast('கடை தகவல் சேமிக்கப்பட்டது');
    });

    $('clear-orders-btn').addEventListener('click', () => {
      if (confirm('அனைத்து ஆர்டர்களும் நிரந்தரமாக நீக்கப்படும். தொடரவா?')) {
        localStorage.removeItem('poomalar_orders');
        showToast('அனைத்து ஆர்டர்களும் நீக்கப்பட்டது');
        refreshDashboard();
        renderOrdersList();
        renderCustomRequests();
      }
    });

    $('export-orders-btn').addEventListener('click', () => {
      const orders = Orders.getAll();
      const json = JSON.stringify(orders, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'poomalar-orders.json'; a.click();
      URL.revokeObjectURL(url);
      showToast('ஆர்டர்கள் export ஆனது');
    });
  }

  // ══════════════════════════════════════════════════════
  // MODAL HELPERS
  // ══════════════════════════════════════════════════════
  function bindModal() {
    $('admin-modal-close').addEventListener('click', closeModal);
    $('admin-modal').addEventListener('click', e => {
      if (e.target === $('admin-modal')) closeModal();
    });
  }

  function openModal(title, bodyHtml) {
    $('admin-modal-title').textContent = title;
    $('admin-modal-body').innerHTML = bodyHtml;
    $('admin-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    $('admin-modal').classList.add('hidden');
    document.body.style.overflow = '';
  }

  // ══════════════════════════════════════════════════════
  // FORM HELPERS
  // ══════════════════════════════════════════════════════
  function getFormData(formId) {
    const form = $(formId);
    if (!form) return {};
    const data = {};
    form.querySelectorAll('[name]').forEach(el => {
      if (el.type === 'checkbox') data[el.name] = el.checked;
      else data[el.name] = el.value;
    });
    return data;
  }

})();
