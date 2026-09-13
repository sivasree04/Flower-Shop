// ============================================================
// POOMALAR WHOLESALE — ORDERS MANAGER
// Handles order creation, persistence, and tracking timeline
// ============================================================

const Orders = (() => {
  const STORAGE_KEY = 'poomalar_orders';

  // ── State ──────────────────────────────────────────────
  let orders = [];

  // ── Persistence ────────────────────────────────────────
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      orders = raw ? JSON.parse(raw) : [];
    } catch {
      orders = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch { /* silent */ }
  }

  // ── Helpers ────────────────────────────────────────────
  function genOrderId() {
    const ts = Date.now().toString().slice(-6);
    const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
    return 'PM' + ts + rand;
  }

  function nowLabel() {
    return new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  /** Determine order type from cart items */
  function detectOrderType(cartItems) {
    if (!cartItems || cartItems.length === 0) return 'flowers';
    // Priority: if any wedding decor → weddingDecor, bouquet → bouquets, else flowers
    const cats = cartItems.map(i => i.category);
    if (cats.includes('weddingDecor')) return 'weddingDecor';
    if (cats.includes('bouquets')) return 'bouquets';
    return 'flowers';
  }

  /** Build initial status timeline with timestamps on first step */
  function buildTimeline(orderType) {
    const { ORDER_STATUSES } = window.ShopData;
    const steps = ORDER_STATUSES[orderType] || ORDER_STATUSES.flowers;
    return steps.map((step, idx) => ({
      ...step,
      state: idx === 0 ? 'done' : idx === 1 ? 'active' : 'pending',
      time: idx === 0 ? nowLabel() : idx === 1 ? 'இப்போது' : '',
    }));
  }

  // ── Public API ─────────────────────────────────────────

  /** Create a new order from cart + checkout data */
  function createOrder({ cartItems, customer, deliveryInfo, total }) {
    const orderType = detectOrderType(cartItems);
    const id = genOrderId();

    const order = {
      id,
      orderType,
      items: cartItems.map(i => ({ ...i })),
      customer: { ...customer },
      delivery: { ...deliveryInfo },
      total: parseFloat(total),
      createdAt: nowLabel(),
      createdTs: Date.now(),
      timeline: buildTimeline(orderType),
      eta: _computeEta(cartItems, deliveryInfo),
      status: 'confirmed', // simple string for display
    };

    orders.unshift(order); // newest first
    save();
    return order;
  }

  /** Create a customization request */
  function createCustomRequest(formData) {
    const id = 'CR' + Date.now().toString().slice(-6) + Math.random().toString(36).slice(2, 4).toUpperCase();
    const order = {
      id,
      orderType: 'customization',
      isCustom: true,
      formData: { ...formData },
      createdAt: nowLabel(),
      createdTs: Date.now(),
      timeline: buildTimeline('customization'),
      eta: 'கோரிக்கை மதிப்பீட்டிற்கு பிறகு',
      status: 'received',
    };
    orders.unshift(order);
    save();
    return order;
  }

  /** Create a wedding decor booking request */
  function createWeddingRequest(formData, serviceItem) {
    const id = 'WD' + Date.now().toString().slice(-6) + Math.random().toString(36).slice(2, 4).toUpperCase();
    const order = {
      id,
      orderType: 'weddingDecor',
      isBooking: true,
      service: { ...serviceItem },
      formData: { ...formData },
      createdAt: nowLabel(),
      createdTs: Date.now(),
      timeline: buildTimeline('weddingDecor'),
      eta: formData.eventDate || 'நிகழ்வு தேதியன்று',
      status: 'received',
    };
    orders.unshift(order);
    save();
    return order;
  }

  /** Get all orders */
  function getAll() {
    return orders.map(o => ({ ...o }));
  }

  /** Get single order by id */
  function getById(id) {
    const o = orders.find(o => o.id === id);
    return o ? { ...o } : null;
  }

  /** Admin: advance order status to next step */
  function advanceStatus(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;
    const tl = order.timeline;
    const activeIdx = tl.findIndex(s => s.state === 'active');
    if (activeIdx === -1) return order;
    tl[activeIdx].state = 'done';
    tl[activeIdx].time = nowLabel();
    const nextIdx = activeIdx + 1;
    if (nextIdx < tl.length) {
      tl[nextIdx].state = 'active';
      tl[nextIdx].time = 'இப்போது';
      order.status = tl[nextIdx].id;
    } else {
      order.status = 'completed';
    }
    save();
    return { ...order };
  }

  /** Admin: set order to any status step */
  function setStatus(orderId, stepId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;
    const tl = order.timeline;
    const targetIdx = tl.findIndex(s => s.id === stepId);
    if (targetIdx === -1) return order;
    tl.forEach((s, i) => {
      if (i < targetIdx) { s.state = 'done'; if (!s.time) s.time = nowLabel(); }
      else if (i === targetIdx) { s.state = 'active'; s.time = nowLabel(); }
      else { s.state = 'pending'; s.time = ''; }
    });
    order.status = stepId;
    save();
    return { ...order };
  }

  /** Admin: add quotation note */
  function addQuotation(orderId, amount, notes) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;
    order.quotation = { amount, notes, sentAt: nowLabel() };
    save();
    return { ...order };
  }

  // ── ETA computation ────────────────────────────────────
  function _computeEta(cartItems, deliveryInfo) {
    if (deliveryInfo && deliveryInfo.deliveryDate) {
      return deliveryInfo.deliveryDate + (deliveryInfo.deliveryTime ? ' ' + deliveryInfo.deliveryTime : '');
    }
    // fallback: pick the longest delivery estimate in cart
    const { DELIVERY_ESTIMATES } = window.ShopData;
    const ORDER = ['1hr', '2hr', '3hr', 'sameday', 'nextday', 'scheduled', 'eventdate'];
    let maxIdx = 0;
    (cartItems || []).forEach(item => {
      const idx = ORDER.indexOf(item.deliveryEstimate);
      if (idx > maxIdx) maxIdx = idx;
    });
    const est = DELIVERY_ESTIMATES[maxIdx];
    return est ? est.label : '2 மணி நேரத்தில்';
  }

  // ── Init ───────────────────────────────────────────────
  load();

  return {
    createOrder,
    createCustomRequest,
    createWeddingRequest,
    getAll,
    getById,
    advanceStatus,
    setStatus,
    addQuotation,
  };
})();

window.Orders = Orders;
