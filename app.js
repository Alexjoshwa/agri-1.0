// AgriDirect — frontend prototype
// Plain JavaScript (vanilla) that stores state in localStorage for client-side testing

(() => {
  // Utilities
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const uid = (prefix='id') => prefix + '_' + Math.random().toString(36).slice(2,9);

  // DOM Elements
  const btnMarket = $('#btn-market');
  const btnListings = $('#btn-listings');
  const btnCreate = $('#btn-create');
  const btnMessages = $('#btn-messages');
  const btnLogin = $('#btn-login');
  const roleSelect = $('#role-select');

  const marketSection = $('#market-section');
  const listingsSection = $('#listings-section');
  const createSection = $('#create-section');
  const messagesSection = $('#messages-section');
  const ordersSection = $('#orders-section');

  const pricesList = $('#prices-list');
  const refreshPrices = $('#refresh-prices');
  const marketFilter = $('#market-filter');

  const listingsGrid = $('#listings-grid');
  const searchListings = $('#search-listings');
  const filterCrop = $('#filter-crop');

  const createForm = $('#create-form');
  const createClear = $('#create-clear');

  const convoList = $('#conversations');
  const convoWindow = $('#convo-window');
  const convoHeader = $('#convo-header');
  const convoMessages = $('#convo-messages');
  const convoForm = $('#convo-form');
  const convoInput = $('#convo-input');

  const ordersList = $('#orders-list');

  const templates = {
    price: $('#price-card'),
    listing: $('#listing-card')
  };

  // Local storage keys
  const LS = {
    LISTINGS: 'agr_listings_v1',
    PRICES: 'agr_prices_v1',
    CONVOS: 'agr_convos_v1',
    ORDERS: 'agr_orders_v1',
    USER: 'agr_user_v1'
  };

  // Default seed data
  const seedPrices = [
    { id:uid('p'), crop:'Tomato', market:'District A', price: 24.5, low:22, high:26, date:todayStr() },
    { id:uid('p'), crop:'Potato', market:'District B', price: 16.2, low:15, high:18, date:todayStr() },
    { id:uid('p'), crop:'Onion', market:'District C', price: 30.0, low:28, high:31, date:todayStr() },
    { id:uid('p'), crop:'Rice (Raw)', market:'District A', price: 45.5, low:44, high:48, date:todayStr() }
  ];

  const seedListings = [
    { id:uid('l'), name:'Ramesh (Farmer)', role:'farmer', crop:'Tomato', grade:'Fresh', qty:120, unit:'kg', price:24, available_from:todayStr(), location:'District A', notes:'Harvest next 2 days', created:Date.now() },
    { id:uid('l'), name:'Meera (Farmer)', role:'farmer', crop:'Potato', grade:'A', qty:500, unit:'kg', price:15.5, available_from:todayStr(), location:'District B', notes:'Good for processing', created:Date.now() },
    { id:uid('l'), name:'Local Buyer', role:'buyer', crop:'Rice (Raw)', grade:'Sela', qty:1000, unit:'kg', price:46, available_from:todayStr(), location:'District A', notes:'Bulk buyer', created:Date.now() }
  ];

  // Data helpers (get/set localStorage)
  const store = {
    get(key, fallback){
      const raw = localStorage.getItem(key);
      if(!raw) return fallback;
      try{ return JSON.parse(raw); }catch(e){ return fallback; }
    },
    set(key, value){
      localStorage.setItem(key, JSON.stringify(value));
    },
    clearAll(){ localStorage.clear(); }
  };

  // Init: ensure seed data exists
  function initData(){
    if(!store.get(LS.PRICES)) store.set(LS.PRICES, seedPrices);
    if(!store.get(LS.LISTINGS)) store.set(LS.LISTINGS, seedListings);
    if(!store.get(LS.CONVOS)) store.set(LS.CONVOS, []);
    if(!store.get(LS.ORDERS)) store.set(LS.ORDERS, []);
  }

  // Helper to format dates
  function todayStr(){ return new Date().toISOString().slice(0,10); }
  function fmtDate(ts){ if(!ts) return ''; const d = new Date(ts); return d.toLocaleString(); }

  // Render market prices
  function renderPrices(){
    const all = store.get(LS.PRICES, []);
    const market = marketFilter.value;
    pricesList.innerHTML = '';
    const filtered = market === 'all' ? all : all.filter(p => p.market === market);
    if(filtered.length === 0){
      pricesList.innerHTML = `<div class="panel">No price data for selected market.</div>`;
      return;
    }
    filtered.forEach(p => {
      const node = templates.price.content.cloneNode(true);
      const card = node.querySelector('.price-card');
      card.querySelector('.pc-crop').textContent = p.crop;
      card.querySelector('.pc-location').textContent = p.market + ' · ' + p.date;
      card.querySelector('.pc-price').textContent = `₹ ${p.price.toFixed(2)}`;
      card.querySelector('.pc-range').textContent = `Range: ₹${p.low} - ₹${p.high}`;
      pricesList.appendChild(node);
    });
  }

  // Simulate fetching new prices (random small changes)
  function refreshPricesAction(){
    const prices = store.get(LS.PRICES, []);
    const updated = prices.map(p => {
      const delta = (Math.random()-0.5) * 2; // -1..+1
      const newPrice = Math.max(1, +(p.price + delta).toFixed(2));
      return { ...p, price:newPrice, low:Math.max(1,Math.round(newPrice-2)), high:Math.round(newPrice+2), date:todayStr() };
    });
    store.set(LS.PRICES, updated);
    renderPrices();
    showToast('Market prices updated.');
  }

  // Render listings
  function renderListings(){
    const all = store.get(LS.LISTINGS, []);
    const query = (searchListings.value || '').toLowerCase().trim();
    const cropFilter = filterCrop.value;
    const filtered = all.filter(l => {
      const matchesQuery = !query || l.crop.toLowerCase().includes(query) || l.location.toLowerCase().includes(query) || (l.name||'').toLowerCase().includes(query);
      const matchesCrop = cropFilter === 'all' || l.crop === cropFilter;
      return matchesQuery && matchesCrop;
    });
    listingsGrid.innerHTML = '';
    // populate crop filter
    const crops = Array.from(new Set(all.map(a => a.crop))).sort();
    filterCrop.innerHTML = `<option value="all">All Crops</option>` + crops.map(c => `<option ${c===cropFilter?'selected':''} value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    if(filtered.length === 0){
      listingsGrid.innerHTML = `<div class="panel">No listings found. Create one to get started.</div>`;
      return;
    }
    filtered.forEach(l => {
      const node = templates.listing.content.cloneNode(true);
      const card = node.querySelector('.listing-card');
      card.querySelector('.listing-crop').textContent = l.crop + (l.grade ? ` · ${l.grade}` : '');
      card.querySelector('.listing-price').textContent = l.price ? `₹ ${Number(l.price).toFixed(2)} / ${l.unit}` : '';
      card.querySelector('.listing-qty').textContent = l.qty;
      card.querySelector('.listing-unit').textContent = l.unit;
      card.querySelector('.listing-location').textContent = l.location;
      card.querySelector('.listing-date').textContent = l.available_from || '';
      card.querySelector('.listing-notes').textContent = l.notes || '';
      const btnOrder = node.querySelector('.btn-order');
      const btnMsg = node.querySelector('.btn-message');
      const btnAccept = node.querySelector('.btn-accept');

      btnOrder.addEventListener('click', () => openOrderModal(l));
      btnMsg.addEventListener('click', () => openConversationForListing(l));
      // If current user is farmer and owns listing show Accept (simulate buyer offer acceptance)
      const me = currentUser();
      if(me && me.role === 'farmer' && me.name && me.name === l.name){
        btnAccept.classList.remove('hidden');
        btnAccept.addEventListener('click', () => acceptOrderMock(l));
      }
      listingsGrid.appendChild(node);
    });
  }

  // Escape HTML
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, (m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  // Simple toast
  function showToast(msg){
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:80px;background:rgba(15,23,36,0.95);color:white;padding:8px 12px;border-radius:8px;z-index:9999';
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 2000);
  }

  // Create listing
  createForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      id: uid('l'),
      name: $('#input-name').value.trim() || 'Unknown',
      role: $('#input-role').value,
      crop: $('#input-crop').value.trim(),
      grade: $('#input-grade').value.trim(),
      qty: Number($('#input-qty').value) || 0,
      unit: $('#input-unit').value.trim() || 'kg',
      price: $('#input-price').value ? Number($('#input-price').value) : null,
      available_from: $('#input-date').value || todayStr(),
      location: $('#input-location').value.trim(),
      notes: $('#input-notes').value.trim(),
      created: Date.now()
    };
    const all = store.get(LS.LISTINGS, []);
    all.unshift(data);
    store.set(LS.LISTINGS, all);
    createForm.reset();
    $('#input-date').value = todayStr();
    showToast('Listing published.');
    renderListings();
    // switch to listings view
    showSection('listings');
  });

  createClear.addEventListener('click', () => createForm.reset());

  // Orders (simple flow)
  function openOrderModal(listing){
    const me = currentUser();
    if(!me || me.role !== 'buyer'){
      showToast('Switch role to Buyer and provide a name to place orders.');
      roleSelect.value = 'buyer';
      return;
    }
    const qty = prompt(`How many ${listing.unit} do you want to order? (Available ${listing.qty})`, Math.min(5, listing.qty));
    if(!qty) return;
    const qtyNum = Number(qty);
    if(isNaN(qtyNum) || qtyNum <= 0) return showToast('Invalid quantity.');
    const priceAgreed = listing.price ? listing.price : Number(prompt('Enter offer price per unit (if seller did not set price):', '0')) || 0;
    const order = {
      id: uid('o'),
      listingId: listing.id,
      buyerName: me.name || 'Buyer',
      sellerName: listing.name,
      crop: listing.crop,
      quantity: qtyNum,
      unit: listing.unit,
      priceAgreed,
      status: 'pending', // pending, accepted, completed, cancelled
      created: Date.now()
    };
    const orders = store.get(LS.ORDERS, []);
    orders.unshift(order);
    store.set(LS.ORDERS, orders);
    showToast('Order placed (pending seller confirmation).');
    renderOrders();
    // create a convo for this order
    ensureConvoForOrder(order, `Order #${order.id} placed for ${order.quantity} ${order.unit} of ${order.crop}`);
  }

  function renderOrders(){
    const all = store.get(LS.ORDERS, []);
    ordersList.innerHTML = '';
    if(all.length === 0){
      ordersList.innerHTML = '<div class="panel">No orders yet.</div>';
      return;
    }
    all.forEach(o => {
      const el = document.createElement('div');
      el.className = 'order-card';
      el.innerHTML = `<div style="display:flex;justify-content:space-between;gap:0.5rem">
        <div><strong>${escapeHtml(o.crop)}</strong><div style="color:var(--muted)">${escapeHtml(o.buyerName)} → ${escapeHtml(o.sellerName)}</div></div>
        <div style="text-align:right"><div>₹ ${Number(o.priceAgreed||0).toFixed(2)}</div><div style="color:var(--muted)">${o.status}</div></div>
      </div>
      <div style="margin-top:0.5rem;color:var(--muted)">Qty: ${o.quantity} ${o.unit} · ${fmtDate(o.created)}</div>
      <div style="margin-top:0.5rem"><button class="small btn-accept-order">Toggle Accept</button></div>`;
      const btnAccept = el.querySelector('.btn-accept-order');
      btnAccept.addEventListener('click', () => {
        o.status = (o.status === 'accepted') ? 'completed' : 'accepted';
        const orders = store.get(LS.ORDERS, []);
        const idx = orders.findIndex(x => x.id === o.id);
        if(idx >= 0) { orders[idx] = o; store.set(LS.ORDERS, orders); }
        renderOrders();
        showToast(`Order ${o.status}`);
      });
      ordersList.appendChild(el);
    });
  }

  function acceptOrderMock(listing){
    // For prototype: find first pending order for this listing's seller
    const orders = store.get(LS.ORDERS, []);
    const o = orders.find(x => x.sellerName === listing.name && x.status === 'pending');
    if(!o){ showToast('No pending orders to accept for this listing.'); return; }
    o.status = 'accepted';
    store.set(LS.ORDERS, orders);
    renderOrders();
    showToast('Order accepted.');
    // create a message to buyer
    ensureConvoForOrder(o, `Seller accepted your order ${o.id}. Arrange pickup/delivery.`);
  }

  // Conversations
  function ensureConvoForOrder(order, initialMsg){
    const convos = store.get(LS.CONVOS, []);
    let convo = convos.find(c => c.orderId === order.id);
    if(!convo){
      convo = { id: uid('c'), orderId: order.id, participants: [order.buyerName, order.sellerName], messages: [] };
      convos.push(convo);
      store.set(LS.CONVOS, convos);
    }
    if(initialMsg) {
      convo.messages.push({ id: uid('m'), from: order.sellerName, text: initialMsg, ts: Date.now() });
      store.set(LS.CONVOS, convos);
    }
    renderConversations();
  }

  // Render conversation list
  function renderConversations(){
    const convos = store.get(LS.CONVOS, []);
    convoList.innerHTML = '';
    if(convos.length === 0){ convoList.innerHTML = '<div class="panel">No conversations yet.</div>'; return; }
    convos.forEach(c => {
      const last = c.messages[c.messages.length-1];
      const participant = c.participants.join(' · ');
      const el = document.createElement('div');
      el.className = 'convo-item';
      el.innerHTML = `<div><strong>${escapeHtml(participant)}</strong><div style="color:var(--muted);font-size:0.9rem">${last ? escapeHtml(last.text.slice(0,80)) : 'No messages'}</div></div>
      <div style="text-align:right;color:var(--muted)">${last ? fmtDate(last.ts) : ''}</div>`;
      el.addEventListener('click', () => openConvo(c.id));
      convoList.appendChild(el);
    });
  }

  function openConversationForListing(listing){
    // Find or create convo with listing owner (no order)
    const convos = store.get(LS.CONVOS, []);
    const me = currentUser();
    const other = listing.name;
    let convo = convos.find(c => c.participants.includes(other) && c.participants.includes(me ? me.name : 'Guest'));
    if(!convo){
      convo = { id: uid('c'), orderId:null, participants: [other, me ? me.name : 'Guest'], messages: [{ id:uid('m'), from: other, text:`Hi, I'm interested in your listing: ${listing.crop} - ${listing.qty} ${listing.unit}`, ts: Date.now() }] };
      convos.unshift(convo);
      store.set(LS.CONVOS, convos);
    }
    renderConversations();
    openConvo(convo.id);
  }

  function openConvo(id){
    const convos = store.get(LS.CONVOS, []);
    const convo = convos.find(c => c.id === id);
    if(!convo) return;
    convoWindow.classList.remove('hidden');
    convoWindow.setAttribute('aria-hidden', 'false');
    convoHeader.textContent = convo.participants.join(' · ');
    convoMessages.innerHTML = '';
    convo.messages.forEach(m => {
      const div = document.createElement('div');
      div.className = 'msg ' + ((currentUser() && currentUser().name === m.from) ? 'me' : 'them');
      div.textContent = `${m.from}: ${m.text}`;
      convoMessages.appendChild(div);
    });
    convoMessages.scrollTop = convoMessages.scrollHeight;
    // attach current open convo id
    convoWindow.dataset.currentConvo = id;
  }

  convoForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = convoInput.value.trim();
    if(!text) return;
    const id = convoWindow.dataset.currentConvo;
    const convos = store.get(LS.CONVOS, []);
    const convo = convos.find(c => c.id === id);
    if(!convo) return;
    const me = currentUser();
    const sender = me ? me.name : 'Guest';
    convo.messages.push({ id: uid('m'), from: sender, text, ts: Date.now() });
    store.set(LS.CONVOS, convos);
    convoInput.value = '';
    openConvo(convo.id);
    showToast('Message sent.');
  });

  // Simple UI navigation
  function showSection(section){
    marketSection.classList.add('hidden');
    listingsSection.classList.add('hidden');
    createSection.classList.add('hidden');
    messagesSection.classList.add('hidden');
    ordersSection.classList.add('hidden');
    btnMarket.classList.remove('active');
    btnListings.classList.remove('active');
    btnCreate.classList.remove('active');
    btnMessages.classList.remove('active');

    if(section === 'market'){ marketSection.classList.remove('hidden'); btnMarket.classList.add('active'); }
    if(section === 'listings'){ listingsSection.classList.remove('hidden'); btnListings.classList.add('active'); }
    if(section === 'create'){ createSection.classList.remove('hidden'); btnCreate.classList.add('active'); }
    if(section === 'messages'){ messagesSection.classList.remove('hidden'); btnMessages.classList.add('active'); }
    if(section === 'orders'){ ordersSection.classList.remove('hidden'); }
  }

  btnMarket.addEventListener('click', ()=> showSection('market'));
  btnListings.addEventListener('click', ()=> showSection('listings'));
  btnCreate.addEventListener('click', ()=> showSection('create'));
  btnMessages.addEventListener('click', ()=> showSection('messages'));

  // Simple sign in (no backend) — stores user name and role in localStorage
  btnLogin.addEventListener('click', () => {
    const name = prompt('Enter your name (stored locally):', currentUser() ? currentUser().name : '');
    if(!name) return;
    const role = roleSelect.value || 'visitor';
    store.set(LS.USER, { name, role });
    showToast(`Signed in as ${name} (${role})`);
    initUI();
  });

  function currentUser(){
    return store.get(LS.USER, null);
  }

  // Initialize UI values
  function initUI(){
    const me = currentUser();
    if(me){
      roleSelect.value = me.role || 'visitor';
      btnLogin.textContent = `Signed in: ${me.name}`;
    } else {
      roleSelect.value = 'visitor';
      btnLogin.textContent = 'Sign In';
    }
    // set default date in create form
    $('#input-date').value = todayStr();
  }

  // Search + filters
  searchListings.addEventListener('input', () => renderListings());
  filterCrop.addEventListener('change', () => renderListings());

  // Market interactions
  refreshPrices.addEventListener('click', refreshPricesAction);
  marketFilter.addEventListener('change', renderPrices);

  // Demo helpers
  function seedIfEmpty(){
    initData();
    renderPrices();
    renderListings();
    renderConversations();
    renderOrders();
    initUI();
  }

  // Optional: Reset data with Shift+R (keeps this as a testing convenience)
  window.addEventListener('keydown', (e) => {
    if(e.key === 'R' && e.shiftKey){
      if(confirm('Reset local prototype data?')) {
        store.clearAll();
        seedIfEmpty();
        showToast('Data reset.');
      }
    }
  });

  // Kickoff
  seedIfEmpty();

})();