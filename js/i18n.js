// ============================================================
// POOKAL WHOLESALE — i18n LANGUAGE SYSTEM
// Language state manager + all UI translation strings
// Supports: 'ta' (Tamil) and 'en' (English / Thanglish)
// ============================================================

const Lang = (() => {
  const STORAGE_KEY  = 'pookal_lang';
  const NAME_KEY     = 'pookal_user_name';
  const THEME_KEY    = 'pookal_theme';
  let current = 'ta'; // default

  function load() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ta' || saved === 'en') current = saved;
    // Apply saved theme immediately
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(savedTheme);
  }

  /* ── User name ── */
  function getName()        { return localStorage.getItem(NAME_KEY) || ''; }
  function setName(name)    { localStorage.setItem(NAME_KEY, name.trim()); }
  function hasName()        { return !!localStorage.getItem(NAME_KEY); }

  /* ── Has the user ever chosen a language? ── */
  function hasChosen()      { return !!localStorage.getItem(STORAGE_KEY); }

  function set(code) {
    if (code !== 'ta' && code !== 'en') return;
    current = code;
    localStorage.setItem(STORAGE_KEY, code);
    document.documentElement.lang = code === 'ta' ? 'ta' : 'en';
  }

  /* ── Theme ── */
  function getTheme()    { return localStorage.getItem(THEME_KEY) || 'dark'; }
  function setTheme(t)   { localStorage.setItem(THEME_KEY, t); applyTheme(t); }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
  }

  function get()      { return current; }
  function isTamil()  { return current === 'ta'; }

  /** Translate a key: returns Tamil or English string */
  function t(key) {
    const entry = STRINGS[key];
    if (!entry) return key; // fallback: return key itself
    return current === 'ta' ? entry.ta : entry.en;
  }

  /** Return product display name based on current language */
  function productName(product) {
    if (current === 'ta') return product.tamilName;
    return product.thanglishName || product.tamilName;
  }

  /** Return product description based on current language */
  function productDesc(product) {
    if (current === 'ta') return product.description || '';
    return product.descriptionEn || product.description || '';
  }

  /** Return unit label based on current language */
  function unitLabel(product) {
    if (typeof product.unit === 'object') {
      return current === 'ta' ? product.unit.tamil : product.unit.english;
    }
    return product.unit;
  }

  /** Return delivery estimate label */
  function deliveryLabel(estimateId) {
    const { DELIVERY_ESTIMATES } = window.ShopData;
    const found = DELIVERY_ESTIMATES.find(d => d.id === estimateId);
    if (!found) return estimateId;
    return current === 'ta' ? found.label : found.labelEn;
  }

  /** Return order status step label */
  function statusLabel(step) {
    return current === 'ta' ? step.label : (step.labelEn || step.label);
  }

  /** Return customization type label */
  function customTypeLabel(type) {
    return current === 'ta' ? type.label : (type.labelEn || type.label);
  }

  /** Return color option label */
  function colorLabel(colorOption) {
    return current === 'ta' ? colorOption.label : (colorOption.labelEn || colorOption.label);
  }

  /** Return flower option string */
  function flowerOptionLabel(flower) {
    // flower is either a string (Tamil) or object
    if (typeof flower === 'object') {
      return current === 'ta' ? flower.ta : flower.en;
    }
    return flower; // Tamil string — used as-is in both modes for flower chips
  }

  // Init
  load();

  return { load, set, get, isTamil, t,
           productName, productDesc, unitLabel, deliveryLabel,
           statusLabel, customTypeLabel, colorLabel, flowerOptionLabel,
           getName, setName, hasName, hasChosen,
           getTheme, setTheme };
})();

// ============================================================
// ALL UI STRINGS
// ============================================================
const STRINGS = {

  // ── App / Brand ────────────────────────────────────────
  'brand.name':      { ta: 'பூக்கள்',               en: 'Pookal' },
  'brand.sub':       { ta: 'மொத்த விற்பனை',          en: 'Wholesale' },
  'brand.tagline':   { ta: 'புதிய பூக்கள் · நேரடி தோட்டத்திலிருந்து', en: 'Fresh Flowers · Direct from Farm' },

  // ── Nav / Drawer ───────────────────────────────────────
  'nav.home':        { ta: 'முகப்பு',               en: 'Home' },
  'nav.flowers':     { ta: 'மலர்கள்',               en: 'Flowers' },
  'nav.bouquets':    { ta: 'பூங்கொத்துகள்',          en: 'Bouquets' },
  'nav.wedding':     { ta: 'திருமண அலங்காரம்',      en: 'Wedding Decor' },
  'nav.custom':      { ta: 'தனிப்பயன் ஆர்டர்',      en: 'Customization' },
  'nav.orders':      { ta: 'என் ஆர்டர்கள்',          en: 'My Orders' },
  'nav.admin':       { ta: 'Admin Dashboard',        en: 'Admin Dashboard' },
  'nav.contact':     { ta: 'தொடர்பு',               en: 'Contact' },
  'nav.hours':       { ta: 'திறந்திருக்கும்: 05:00 – 21:00', en: 'Open: 05:00 – 21:00' },
  'nav.back':        { ta: '← திரும்பு',            en: '← Back' },
  'nav.language':    { ta: 'மொழி',                   en: 'Language' },

  // ── Bottom Nav ─────────────────────────────────────────
  'bnav.home':       { ta: 'முகப்பு',               en: 'Home' },
  'bnav.flowers':    { ta: 'மலர்கள்',               en: 'Flowers' },
  'bnav.bouquets':   { ta: 'பூங்கொத்து',             en: 'Bouquets' },
  'bnav.wedding':    { ta: 'திருமணம்',               en: 'Wedding' },
  'bnav.cart':       { ta: 'கூடை',                   en: 'Cart' },

  // ── Home Page ──────────────────────────────────────────
  'home.hero.badge':     { ta: '🌿 நேரடி தோட்டத்திலிருந்து',  en: '🌿 Direct from Farm' },
  'home.hero.title':     { ta: 'தாஜா பூக்கள்\nசிறந்த விலையில்', en: 'Fresh Flowers\nAt Wholesale Price' },
  'home.hero.sub':       { ta: 'மொத்த விற்பனை · திருமண அலங்காரம் · தனிப்பயன் கோரிக்கை', en: 'Wholesale · Wedding Decor · Custom Orders' },
  'home.hero.cta1':      { ta: 'மலர்கள் வாங்க',     en: 'Shop Flowers' },
  'home.hero.cta2':      { ta: 'திருமண சேவை',       en: 'Wedding Services' },
  'home.delivery.fast':  { ta: '1 மணி நேரத்தில்',   en: 'Within 1 Hour' },
  'home.delivery.fresh': { ta: 'புதிய பூக்கள்',      en: 'Fresh Flowers' },
  'home.delivery.price': { ta: 'மொத்த விலை',         en: 'Wholesale Price' },
  'home.section.what':   { ta: 'என்ன தேவை?',         en: 'What do you need?' },
  'home.section.choose': { ta: 'வகை தேர்ந்தெடுங்கள்', en: 'Choose a category' },
  'home.section.today':  { ta: 'இன்றைய சிறப்பு',     en: "Today's Special" },
  'home.section.all':    { ta: 'அனைத்தும் →',         en: 'See all →' },
  'home.why.title':      { ta: 'ஏன் பூக்கள்?',        en: 'Why Pookal?' },
  'home.why.farm':       { ta: 'நேரடி தோட்டம்',      en: 'Direct from Farm' },
  'home.why.farm.text':  { ta: 'தோட்டத்திலிருந்து நேரடியாக. இடைத்தரகர் இல்லை.', en: 'Straight from the farm. No middleman.' },
  'home.why.fast':       { ta: 'விரைவான வழங்கல்',    en: 'Fast Delivery' },
  'home.why.fast.text':  { ta: '1 மணி நேரத்தில் புதிய பூக்கள் உங்கள் வீட்டிற்கு.', en: 'Fresh flowers to your door within 1 hour.' },
  'home.why.price':      { ta: 'மொத்த விலை',          en: 'Wholesale Price' },
  'home.why.price.text': { ta: 'சில்லறை விலையில் பாதி விலையில் மொத்தமாக வாங்குங்கள்.', en: 'Get flowers at half the retail price wholesale.' },
  'home.why.wedding':    { ta: 'திருமண நிபுணர்கள்',  en: 'Wedding Experts' },
  'home.why.wedding.text':{ ta: '10+ வருட திருமண அலங்கார அனுபவம்.', en: '10+ years of wedding decoration experience.' },

  // ── Category counts ────────────────────────────────────
  'cat.flowers.count':   { ta: '12 வகைகள்',          en: '12 varieties' },
  'cat.bouquets.count':  { ta: '7 வகைகள்',           en: '7 varieties' },
  'cat.wedding.count':   { ta: '7 சேவைகள்',          en: '7 services' },
  'cat.custom.count':    { ta: 'உங்கள் விருப்பம்',   en: 'Your choice' },

  // ── Flowers view ───────────────────────────────────────
  'flowers.sub':         { ta: 'மொத்த விற்பனை',       en: 'Wholesale' },
  'filter.all':          { ta: 'அனைத்தும்',            en: 'All' },
  'filter.available':    { ta: 'கிடைக்கும்',           en: 'Available' },
  'filter.popular':      { ta: 'பிரபலம்',              en: 'Popular' },
  'filter.premium':      { ta: 'Premium',              en: 'Premium' },
  'filter.sameday':      { ta: 'இன்றே',                en: 'Same Day' },
  'filter.gift':         { ta: 'Gift',                 en: 'Gift' },
  'filter.romantic':     { ta: 'Romantic',             en: 'Romantic' },

  // ── Bouquets view ──────────────────────────────────────
  'bouquets.sub':        { ta: 'அனைத்து சந்தர்ப்பங்களுக்கும்', en: 'For all occasions' },

  // ── Wedding view ───────────────────────────────────────
  'wedding.sub':         { ta: 'விலை கோரிக்கை',       en: 'Price on Request' },
  'wedding.banner':      { ta: '💡 விலைகள் நிகழ்வின் அளவு மற்றும் தேவைகளின் படி மாறும். விலை கோரிக்கை இலவசம்.', en: '💡 Prices vary by event size and requirements. Quotation is free.' },
  'wedding.starting':    { ta: 'தொடக்க விலை',          en: 'Starting from' },
  'wedding.varies':      { ta: '+ நிகழ்வு பொறுத்து மாறும்', en: '+ varies by event' },
  'wedding.fixed':       { ta: 'நிலையான விலை',         en: 'Fixed price' },
  'wedding.quote.btn':   { ta: '📋 விலை கோரிக்கை',    en: '📋 Request Quote' },
  'wedding.detail.btn':  { ta: 'விவரங்கள்',             en: 'Details' },

  // ── Customization view ─────────────────────────────────
  'custom.sub':          { ta: 'உங்கள் விருப்பம்',     en: 'Your choice' },
  'custom.intro':        { ta: 'உங்களுக்கு என்ன வேண்டும் என்று சொல்லுங்கள். நாங்கள் உங்களுக்கு சிறந்த மாதிரி தயாரித்து விலை தெரிவிக்கிறோம்.', en: 'Tell us what you need. We will prepare the best design and send you a quote.' },
  'custom.type.label':   { ta: 'கோரிக்கை வகை',         en: 'Request type' },
  'custom.req.label':    { ta: 'உங்கள் தேவை விவரம்',   en: 'Your requirement' },
  'custom.req.ph':       { ta: 'எ.கா: "சிவப்பு மற்றும் வெள்ளை ரோஜா மாலை வேண்டும். நீளம் 6 அடி."', en: 'e.g. "Red and white rose mala. Length 6 feet. Wedding date: 20 October."' },
  'custom.flower.label': { ta: 'பூ தேர்வு',             en: 'Select flowers' },
  'custom.color.label':  { ta: 'நிற தேர்வு',            en: 'Select colours' },
  'custom.budget.label': { ta: 'பட்ஜெட் (₹)',           en: 'Budget (₹)' },
  'custom.budget.ph':    { ta: 'எ.கா: 2000',            en: 'e.g. 2000' },
  'custom.date.label':   { ta: 'நிகழ்வு / வழங்கல் தேதி', en: 'Event / Delivery date' },
  'custom.time.label':   { ta: 'விரும்பிய நேரம்',        en: 'Preferred time' },
  'custom.loc.label':    { ta: 'இடம் / முகவரி',          en: 'Location / Address' },
  'custom.loc.ph':       { ta: 'நிகழ்வு நடைபெறும் இடம்', en: 'Where the event takes place' },
  'custom.image.label':  { ta: 'மாதிரி படம் (விரும்பினால்)', en: 'Reference image (optional)' },
  'custom.image.text':   { ta: 'படத்தை தேர்ந்தெடுங்கள் அல்லது இழுத்து விடுங்கள்', en: 'Tap to select or drag an image here' },
  'custom.image.sub':    { ta: 'PNG, JPG · அதிகபட்சம் 5MB', en: 'PNG, JPG · Max 5MB' },
  'custom.notes.label':  { ta: 'கூடுதல் குறிப்புகள்',   en: 'Additional notes' },
  'custom.notes.ph':     { ta: 'வேறு ஏதாவது சொல்ல விரும்புகிறீர்களா?', en: 'Anything else to share?' },
  'custom.your.info':    { ta: 'உங்கள் தகவல்',           en: 'Your details' },
  'custom.name.label':   { ta: 'பெயர்',                  en: 'Name' },
  'custom.name.ph':      { ta: 'உங்கள் பெயர்',           en: 'Your name' },
  'custom.phone.label':  { ta: 'மொபைல் எண்',             en: 'Mobile number' },
  'custom.submit.btn':   { ta: '✨ கோரிக்கையை அனுப்பு', en: '✨ Submit Request' },
  'custom.success.title':{ ta: 'கோரிக்கை பெறப்பட்டது!', en: 'Request Received!' },
  'custom.success.msg':  { ta: 'உங்கள் தனிப்பயன் கோரிக்கை வெற்றிகரமாக பதிவு செய்யப்பட்டது. 24 மணி நேரத்தில் நாங்கள் தொடர்பு கொள்கிறோம்.', en: 'Your customization request has been received. We will contact you within 24 hours.' },
  'custom.success.back': { ta: 'முகப்பிற்கு திரும்பு',   en: 'Back to Home' },
  'custom.req.id.prefix':{ ta: 'கோரிக்கை எண்: ',        en: 'Request ID: ' },

  // ── Customization type labels ──────────────────────────
  'ctype.mala':    { ta: 'மாலை தயாரிப்பு',        en: 'Maalai Customization' },
  'ctype.bouquet': { ta: 'பூங்கொத்து தயாரிப்பு',  en: 'Bouquet Customization' },
  'ctype.wedding': { ta: 'திருமண அலங்காரம்',       en: 'Thirumana Alangaram' },
  'ctype.car':     { ta: 'கார் அலங்காரம்',          en: 'Car Alangaram' },
  'ctype.pooja':   { ta: 'பூஜை பூ அலங்காரம்',      en: 'Pooja Poo Alangaram' },
  'ctype.other':   { ta: 'மற்ற கோரிக்கை',           en: 'Other Request' },

  // ── Color labels ───────────────────────────────────────
  'color.red':     { ta: 'சிவப்பு',    en: 'Red' },
  'color.white':   { ta: 'வெள்ளை',    en: 'White' },
  'color.yellow':  { ta: 'மஞ்சள்',    en: 'Yellow' },
  'color.pink':    { ta: 'இளஞ்சிவப்பு', en: 'Pink' },
  'color.orange':  { ta: 'ஆரஞ்சு',    en: 'Orange' },
  'color.purple':  { ta: 'ஊதா',       en: 'Purple' },
  'color.blue':    { ta: 'நீலம்',     en: 'Blue' },
  'color.green':   { ta: 'பச்சை',     en: 'Green' },
  'color.mixed':   { ta: 'கலப்பு நிறங்கள்', en: 'Mixed Colors' },

  // ── Product card strings ───────────────────────────────
  'product.qty.label':   { ta: 'அளவு:',              en: 'Qty:' },
  'product.count.label': { ta: 'எண்ணிக்கை:',         en: 'Qty:' },
  'product.add.cart':    { ta: '+ கூடையில் சேர்',    en: '+ Add to Cart' },
  'product.added':       { ta: '✓ சேர்க்கப்பட்டது', en: '✓ Added' },
  'product.unavailable': { ta: 'கிடைக்கவில்லை',      en: 'Unavailable' },
  'product.stock.ok':    { ta: '✅ கிடைக்கும்',      en: '✅ In Stock' },
  'product.stock.low':   { ta: '⚠️ குறைவாக உள்ளது', en: '⚠️ Low Stock' },
  'product.stock.out':   { ta: '❌ இல்லை',           en: '❌ Out of Stock' },
  'product.min.order':   { ta: '📦 குறைந்தது',        en: '📦 Min order' },
  'product.prep.time':   { ta: '🕐',                  en: '🕐' },
  'product.sameday':     { ta: '⚡ இன்றே',            en: '⚡ Same Day' },
  'product.size.small':  { ta: 'சிறியது',             en: 'Small' },
  'product.size.medium': { ta: 'நடுத்தரம்',           en: 'Medium' },
  'product.size.large':  { ta: 'பெரியது',             en: 'Large' },

  // ── Cart ───────────────────────────────────────────────
  'cart.title':          { ta: 'கூடை',               en: 'Cart' },
  'cart.empty.title':    { ta: 'கூடை காலி',           en: 'Your cart is empty' },
  'cart.empty.sub':      { ta: 'இன்னும் எதுவும் சேர்க்கவில்லை.', en: 'Nothing added yet.' },
  'cart.empty.btn':      { ta: 'மலர்கள் வாங்க',       en: 'Shop Flowers' },
  'cart.items':          { ta: 'பொருள்',              en: 'items' },
  'cart.subtotal':       { ta: 'விலை மொத்தம்',        en: 'Subtotal' },
  'cart.delivery':       { ta: 'வழங்கல் கட்டணம்',    en: 'Delivery fee' },
  'cart.delivery.free':  { ta: 'இலவசம்',              en: 'Free' },
  'cart.total':          { ta: 'மொத்த தொகை',          en: 'Total' },
  'cart.checkout.btn':   { ta: 'ஆர்டர் செய்வது →',   en: 'Checkout →' },
  'cart.remove.confirm': { ta: 'இந்த பொருளை கூடையிலிருந்து நீக்கவா?', en: 'Remove this item from cart?' },

  // ── Checkout ───────────────────────────────────────────
  'checkout.title':      { ta: 'செக்அவுட்',           en: 'Checkout' },
  'checkout.summary':    { ta: 'ஆர்டர் சுருக்கம்',    en: 'Order Summary' },
  'checkout.delivery':   { ta: 'வழங்கல் விவரங்கள்',   en: 'Delivery Details' },
  'checkout.payment':    { ta: 'கட்டண முறை',           en: 'Payment Method' },
  'checkout.name.label': { ta: 'பெயர்',               en: 'Name' },
  'checkout.name.ph':    { ta: 'உங்கள் முழு பெயர்',   en: 'Your full name' },
  'checkout.phone.label':{ ta: 'மொபைல் எண்',           en: 'Mobile number' },
  'checkout.addr.label': { ta: 'முகவரி',              en: 'Address' },
  'checkout.addr.ph':    { ta: 'வீட்டு எண், தெரு, நகரம்', en: 'House no., street, city' },
  'checkout.date.label': { ta: 'வழங்கல் தேதி',         en: 'Delivery date' },
  'checkout.time.label': { ta: 'விரும்பிய நேரம்',      en: 'Preferred time' },
  'checkout.notes.label':{ ta: 'கூடுதல் குறிப்பு',    en: 'Additional notes' },
  'checkout.notes.ph':   { ta: 'சிறப்பு வழிமுறைகள், நுழைவு விவரங்கள்…', en: 'Special instructions, entry details…' },
  'checkout.cod':        { ta: 'வழங்கும் போது பணம்',  en: 'Cash on Delivery' },
  'checkout.cod.sub':    { ta: 'Cash on Delivery',     en: 'Pay when delivered' },
  'checkout.upi':        { ta: 'UPI / PhonePe / GPay', en: 'UPI / PhonePe / GPay' },
  'checkout.upi.sub':    { ta: 'ஆன்லைன் கட்டணம்',    en: 'Online payment' },
  'checkout.place.btn':  { ta: '🛒 ஆர்டர் செய்யுங்கள்', en: '🛒 Place Order' },
  'checkout.total.label':{ ta: 'மொத்தம்',              en: 'Total' },

  // ── Order Success ──────────────────────────────────────
  'success.title':       { ta: 'ஆர்டர் வெற்றிகரமாக சேர்க்கப்பட்டது!', en: 'Order Placed Successfully!' },
  'success.sub1':        { ta: 'உங்கள் ஆர்டர் பெறப்பட்டது. நாங்கள் விரைவில் உறுதிப்படுத்துகிறோம்.', en: 'Your order has been received. We will confirm it shortly.' },
  'success.del.date':    { ta: 'வழங்கல் தேதி:',        en: 'Delivery date:' },
  'success.eta':         { ta: 'மதிப்பீட்டு நேரம்:',   en: 'Estimated time:' },
  'success.order.id':    { ta: 'ஆர்டர் எண்: ',         en: 'Order ID: ' },
  'success.track.btn':   { ta: '📦 ஆர்டர் நிலை காண',  en: '📦 Track Order' },
  'success.home.btn':    { ta: 'முகப்பிற்கு திரும்பு', en: 'Back to Home' },

  // ── Order tracking ─────────────────────────────────────
  'orders.title':        { ta: 'என் ஆர்டர்கள்',        en: 'My Orders' },
  'orders.empty.title':  { ta: 'ஆர்டர்கள் இல்லை',      en: 'No orders yet' },
  'orders.empty.sub':    { ta: 'இன்னும் எந்த ஆர்டரும் செய்யவில்லை.', en: 'You have not placed any orders yet.' },
  'orders.empty.btn':    { ta: 'இப்போதே வாங்குங்கள்',  en: 'Shop Now' },
  'orders.show.status':  { ta: '▼ நிலை காட்டு',        en: '▼ Show Status' },
  'orders.hide.status':  { ta: '▲ மறை',                en: '▲ Hide' },
  'orders.eta.label':    { ta: '⏱',                    en: '⏱' },
  'orders.type.flowers': { ta: '🌸 மலர்கள் ஆர்டர்',   en: '🌸 Flowers Order' },
  'orders.type.bouquets':{ ta: '💐 பூங்கொத்து ஆர்டர்', en: '💐 Bouquet Order' },
  'orders.type.wedding': { ta: '💒 திருமண கோரிக்கை',  en: '💒 Wedding Booking' },
  'orders.type.custom':  { ta: '✨ தனிப்பயன் கோரிக்கை', en: '✨ Custom Request' },
  'orders.pending.price':{ ta: 'விலை நிலுவையில்',      en: 'Price pending' },

  // ── Wedding booking modal ──────────────────────────────
  'wedding.modal.title': { ta: 'விலை கோரிக்கை',        en: 'Request a Quote' },
  'wedding.modal.name':  { ta: 'உங்கள் பெயர்',          en: 'Your name' },
  'wedding.modal.phone': { ta: 'மொபைல்',               en: 'Mobile' },
  'wedding.modal.date':  { ta: 'நிகழ்வு தேதி',          en: 'Event date' },
  'wedding.modal.time':  { ta: 'நேரம்',                 en: 'Time' },
  'wedding.modal.venue': { ta: 'இடம் / மண்டபம்',        en: 'Venue / Hall' },
  'wedding.modal.venue.ph': { ta: 'திருமண மண்டப பெயர் மற்றும் முகவரி', en: 'Wedding hall name and address' },
  'wedding.modal.budget':{ ta: 'பட்ஜெட் (₹)',           en: 'Budget (₹)' },
  'wedding.modal.notes': { ta: 'கூடுதல் குறிப்பு',      en: 'Additional notes' },
  'wedding.modal.notes.ph': { ta: 'சிறப்பு தேவைகள்…',  en: 'Special requirements…' },
  'wedding.modal.submit':{ ta: '📋 கோரிக்கை அனுப்பு',  en: '📋 Send Request' },
  'wedding.modal.details':{ ta: 'விவரங்கள்',             en: 'Details' },
  'wedding.modal.book.from': { ta: 'தொடக்க விலை:',      en: 'Starting from:' },
  'wedding.modal.services': { ta: 'சேவைகள் உள்ளடக்கம்:', en: 'Services included:' },
  'wedding.modal.book.btn': { ta: 'விலை கோரிக்கை அனுப்பு', en: 'Send Quote Request' },
  'wedding.received.toast': { ta: 'கோரிக்கை பெறப்பட்டது!', en: 'Booking request received!' },

  // ── Search ─────────────────────────────────────────────
  'search.ph':           { ta: 'மலர்கள், பூங்கொத்து தேடுங்கள்…', en: 'Search flowers, bouquets…' },
  'search.results':      { ta: 'தேடல் முடிவுகள்',       en: 'Search Results' },
  'search.no.results':   { ta: 'முடிவு எதுவும் இல்லை',  en: 'No results found' },
  'search.no.results.sub':{ ta: 'வேறு வார்த்தைகளில் தேடுங்கள்', en: 'Try different keywords' },

  // ── Validation toasts ──────────────────────────────────
  'toast.min.qty':       { ta: 'குறைந்தது {min} {unit} தேர்வு செய்யுங்கள்', en: 'Minimum order: {min} {unit}' },
  'toast.added.cart':    { ta: '{name} கூடையில் சேர்க்கப்பட்டது! 🌸', en: '{name} added to cart! 🌸' },
  'toast.added.bouquet': { ta: '{name} கூடையில் சேர்க்கப்பட்டது! 💐', en: '{name} added to cart! 💐' },
  'toast.fill.required': { ta: 'தேவையான தகவல்களை நிரப்பவும்',   en: 'Please fill required fields' },
  'toast.invalid.phone': { ta: 'சரியான மொபைல் எண் உள்ளிடவும்', en: 'Enter a valid 10-digit mobile number' },
  'toast.select.type':   { ta: 'கோரிக்கை வகை தேர்வு செய்யுங்கள்', en: 'Please select a request type' },
  'toast.fill.req':      { ta: 'உங்கள் தேவை விவரம் உள்ளிடவும்', en: 'Please describe your requirement' },
  'toast.fill.budget':   { ta: 'பட்ஜெட் உள்ளிடவும்',             en: 'Please enter a budget' },
  'toast.fill.date':     { ta: 'தேதி தேர்வு செய்யுங்கள்',         en: 'Please select a date' },
  'toast.fill.location': { ta: 'இடம் உள்ளிடவும்',                en: 'Please enter a location' },
  'toast.fill.name':     { ta: 'உங்கள் பெயர் உள்ளிடவும்',        en: 'Please enter your name' },
  'toast.fill.address':  { ta: 'முகவரி உள்ளிடவும்',              en: 'Please enter your address' },
  'toast.fill.del.date': { ta: 'வழங்கல் தேதி தேர்வு செய்யுங்கள்', en: 'Please select a delivery date' },

  // ── Language screen ────────────────────────────────────
  'lang.select.title':   { ta: 'மொழி தேர்வு செய்யுங்கள்', en: 'Choose Your Language' },
  'lang.select.sub':     { ta: 'நீங்கள் எந்த மொழியில் பேசுகிறீர்கள்?', en: 'Which language do you prefer?' },
  'lang.tamil.label':    { ta: 'தமிழ்',                  en: 'தமிழ்' },
  'lang.english.label':  { ta: 'English',                en: 'English' },
  'lang.tamil.sub':      { ta: 'Tamil',                  en: 'Tamil' },
  'lang.english.sub':    { ta: 'ஆங்கிலம்',              en: 'English' },
  'lang.switcher.label': { ta: 'மொழி மாற்று',            en: 'Switch Language' },
  // ── Settings view ──────────────────────────────────────
  'settings.title':      { ta: 'அமைப்புகள்',          en: 'Settings' },
  'settings.language':   { ta: 'மொழி',                 en: 'Language' },
  'settings.lang.tamil': { ta: 'தமிழ்',                en: 'Tamil' },
  'settings.lang.en':    { ta: 'English',              en: 'English' },
  'settings.theme':      { ta: 'தோற்றம்',              en: 'Theme' },
  'settings.theme.dark': { ta: '🌙 இருண்ட தோற்றம்',   en: '🌙 Dark' },
  'settings.theme.light':{ ta: '☀️ வெளிர் தோற்றம்',  en: '☀️ Light' },
  'settings.name':       { ta: 'உங்கள் பெயர்',         en: 'Your Name' },
  'settings.name.ph':    { ta: 'உங்கள் பெயர் உள்ளிடுங்கள்', en: 'Enter your name' },
  'settings.save':       { ta: '✓ சேமி',               en: '✓ Save' },
  'settings.saved':      { ta: 'சேமிக்கப்பட்டது!',     en: 'Saved!' },
  'settings.greeting':   { ta: 'வணக்கம்',              en: 'Hello' },
  'settings.current.lang':{ ta: 'தற்போதைய மொழி',      en: 'Current language' },
  'settings.app.info':   { ta: 'செயலி பற்றி',           en: 'About App' },
  'settings.version':    { ta: 'பதிப்பு 1.0',           en: 'Version 1.0' },
  'settings.contact':    { ta: 'தொடர்பு கொள்ள',        en: 'Contact Us' },

  // ── Onboarding screen ──────────────────────────────────
  'onboard.welcome':     { ta: 'பூக்கள் உலகிற்கு வரவேற்கிறோம்!', en: 'Welcome to Pookal!' },
  'onboard.sub':         { ta: 'நேரடி தோட்டத்திலிருந்து புதிய பூக்கள்', en: 'Fresh flowers direct from the farm' },
  'onboard.name.label':  { ta: 'உங்கள் பெயர்',         en: 'Your name' },
  'onboard.name.ph':     { ta: 'பெயர் உள்ளிடுங்கள்',  en: 'Enter your name' },
  'onboard.lang.label':  { ta: 'மொழி தேர்வு செய்யுங்கள்', en: 'Choose language' },
  'onboard.start':       { ta: 'தொடங்குவோம் →',        en: "Let's start →" },
  'onboard.name.error':  { ta: 'பெயர் உள்ளிடவும்',     en: 'Please enter your name' },

};

// ── Flower options bilingual ──────────────────────────────
const FLOWER_OPTIONS_BILINGUAL = [
  { ta: 'ரோஜா',            en: 'Roja' },
  { ta: 'மல்லிகை',          en: 'Malligai' },
  { ta: 'முல்லை',           en: 'Mullai' },
  { ta: 'சாமந்தி',          en: 'Samanthi' },
  { ta: 'செவ்வந்தி',        en: 'Sevvanthi' },
  { ta: 'கனகாம்பரம்',      en: 'Kanakambaram' },
  { ta: 'சம்பங்கி',         en: 'Sampangi' },
  { ta: 'தாமரை',            en: 'Thaamarai' },
  { ta: 'பிச்சிப்பூ',       en: 'Pichipoo' },
  { ta: 'ஜெர்பரா',          en: 'Jerbera' },
  { ta: 'சூரியகாந்தி',      en: 'Sooriyakanthi' },
  { ta: 'ஆர்க்கிட்',        en: 'Orchid' },
  { ta: 'லில்லி',           en: 'Lily' },
  { ta: 'கலப்பு பூக்கள்',   en: 'Mixed Flowers' },
];

window.Lang = Lang;
window.STRINGS = STRINGS;
window.FLOWER_OPTIONS_BILINGUAL = FLOWER_OPTIONS_BILINGUAL;
