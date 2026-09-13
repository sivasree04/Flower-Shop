// ============================================================
// POOMALAR WHOLESALE — CART MANAGER
// Handles all cart state, persistence, and rendering
// ============================================================

const Cart = (() => {
  const STORAGE_KEY = 'poomalar_cart';

  // ── State ──────────────────────────────────────────────
  let items = []; // Array of cart item objects

  // ── Cart Item Shape ────────────────────────────────────
  // {
  //   cartId    : unique string
  //   productId : product id from data
  //   category  : 'flowers' | 'bouquets' | 'weddingDecor'
  //   tamilName : string
  //   englishName: string
  //   image     : url string
  //   price     : number (unit price at time of add)
  //   unit      : string
  //   quantity  : number
  //   size      : string | null  (for bouquets)
  //   sizeLabel : string | null
  //   notes     : string
  // }

  // ── Persistence ────────────────────────────────────────
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      items = raw ? JSON.parse(raw) : [];
    } catch {
      items = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch { /* storage full – silent */ }
  }

  // ── Helpers ────────────────────────────────────────────
  function genId() {
    return 'ci_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  }

  function getDeliveryLabel(estimateId) {
    const { DELIVERY_ESTIMATES } = window.ShopData;
    const found = DELIVERY_ESTIMATES.find(d => d.id === estimateId);
    return found ? found.label : estimateId;
  }

  // ── Public API ─────────────────────────────────────────

  /** Add a flower/bouquet/weddingDecor item to cart */
  function addItem({ productId, category, tamilName, englishName, image, price,
                     unit, quantity, size, sizeLabel, notes, deliveryEstimate }) {
    quantity = parseFloat(quantity) || 1;
    if (quantity <= 0) return false;

    // Check if same product+size already in cart → update qty instead
    const existing = items.find(i => i.productId === productId && i.size === (size || null));
    if (existing) {
      existing.quantity = parseFloat((existing.quantity + quantity).toFixed(3));
      save();
      _emitChange();
      return 'updated';
    }

    items.push({
      cartId: genId(),
      productId,
      category,
      tamilName,
      englishName: englishName || '',
      image,
      price: parseFloat(price),
      unit: unit || '',
      quantity,
      size: size || null,
      sizeLabel: sizeLabel || null,
      notes: notes || '',
      deliveryEstimate: deliveryEstimate || '',
      deliveryLabel: getDeliveryLabel(deliveryEstimate),
    });

    save();
    _emitChange();
    return 'added';
  }

  /** Remove item by cartId */
  function removeItem(cartId) {
    items = items.filter(i => i.cartId !== cartId);
    save();
    _emitChange();
  }

  /** Update quantity for a cart item */
  function updateQty(cartId, newQty) {
    newQty = parseFloat(newQty);
    if (isNaN(newQty) || newQty <= 0) {
      removeItem(cartId);
      return;
    }
    const item = items.find(i => i.cartId === cartId);
    if (item) {
      item.quantity = parseFloat(newQty.toFixed(3));
      save();
      _emitChange();
    }
  }

  /** Clear all items */
  function clear() {
    items = [];
    save();
    _emitChange();
  }

  /** Get all items (read-only copy) */
  function getItems() {
    return items.map(i => ({ ...i }));
  }

  /** Count total number of distinct items */
  function getCount() {
    return items.length;
  }

  /** Grand total */
  function getTotal() {
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  /** Formatted total */
  function getTotalFormatted() {
    return '₹' + getTotal().toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  // ── Change event ───────────────────────────────────────
  const _listeners = [];

  function onChange(fn) {
    _listeners.push(fn);
  }

  function _emitChange() {
    _listeners.forEach(fn => fn(items));
  }

  // ── Init ───────────────────────────────────────────────
  load();

  return {
    addItem,
    removeItem,
    updateQty,
    clear,
    getItems,
    getCount,
    getTotal,
    getTotalFormatted,
    onChange,
  };
})();

window.Cart = Cart;
