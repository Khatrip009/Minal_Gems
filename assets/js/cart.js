// assets/js/cart.js
(function () {
  const CART_KEY = 'pmg_cart';
  const ORDER_KEY = 'pmg_last_order';

  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.PMG && window.PMG.updateCartBadge && window.PMG.updateCartBadge();
  }

  function findItemIndex(cart, id) {
    return cart.findIndex(i => i.id === id);
  }

  // Public: add to cart
  window.addToCart = function (item) {
    // item: {id, title, price, img, qty}
    const cart = readCart();
    const idx = findItemIndex(cart, item.id);
    if (idx === -1) {
      cart.push(Object.assign({ qty: 1 }, item));
    } else {
      cart[idx].qty = (cart[idx].qty || 0) + (item.qty || 1);
    }
    writeCart(cart);
    showToast('Added to cart');
  };

  // Public: set quantity
  window.updateCartQty = function (id, qty) {
    const cart = readCart();
    const idx = findItemIndex(cart, id);
    if (idx === -1) return;
    cart[idx].qty = Math.max(0, Number(qty) || 0);
    if (cart[idx].qty === 0) cart.splice(idx, 1);
    writeCart(cart);
    renderCart();
  };

  // Public: remove
  window.removeFromCart = function (id) {
    const cart = readCart().filter(i => i.id !== id);
    writeCart(cart);
    renderCart();
  };

  // Calculate totals
  function calcTotals(cart) {
    const subtotal = cart.reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 1), 0);
    const tax = Math.round(subtotal * 0.05); // demo 5% tax
    const shipping = subtotal > 50000 ? 0 : 200; // demo rule
    const total = subtotal + tax + shipping;
    return { subtotal, tax, shipping, total };
  }

  // Render cart table in #cartBody and totals in #cartTotals
  window.renderCart = function () {
    const cart = readCart();
    const cartBody = document.getElementById('cartBody');
    const cartTotals = document.getElementById('cartTotals');

    if (!cartBody || !cartTotals) return;

    cartBody.innerHTML = '';
    if (cart.length === 0) {
      cartBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Your cart is empty.</td></tr>';
      cartTotals.innerHTML = '';
      return;
    }

    cart.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="width:80px"><img src="${item.img || 'assets/images/products/placeholder.jpg'}" style="width:70px; height:70px; object-fit:cover; border-radius:8px"></td>
        <td>
          <strong>${escapeHtml(item.title)}</strong><br>
          <small class="text-muted">${item.meta || ''}</small>
        </td>
        <td>₹${numberFormat(item.price)}</td>
        <td style="width:120px">
          <input type="number" min="1" value="${item.qty}" class="form-control form-control-sm" onchange="updateCartQty('${item.id}', this.value)">
        </td>
        <td>₹${numberFormat((item.price || 0) * (item.qty || 1))}</td>
        <td><button class="btn btn-sm btn-outline-danger" onclick="removeFromCart('${item.id}')">Remove</button></td>
      `;
      cartBody.appendChild(tr);
    });

    const t = calcTotals(cart);
    cartTotals.innerHTML = `
      <div><strong>Subtotal:</strong> ₹${numberFormat(t.subtotal)}</div>
      <div><strong>Tax (5%):</strong> ₹${numberFormat(t.tax)}</div>
      <div><strong>Shipping:</strong> ₹${numberFormat(t.shipping)}</div>
      <hr>
      <div class="fw-bold">Total: ₹${numberFormat(t.total)}</div>
    `;
  };

  // Checkout: create order and redirect to order-confirmation.html?orderId=...
  window.checkoutCart = function (billing) {
    // billing: {name, phone, address} - optional in demo
    const cart = readCart();
    if (!cart.length) {
      alert('Your cart is empty');
      return;
    }
    const totals = calcTotals(cart);
    const orderId = 'PMG' + Date.now().toString().slice(-8).toUpperCase();
    const order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      items: cart,
      totals,
      billing: billing || {},
      status: 'Placed' // initial status
    };
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    // clear cart after order placed
    localStorage.removeItem(CART_KEY);
    window.PMG && window.PMG.updateCartBadge && window.PMG.updateCartBadge();
    // redirect to confirmation
    window.location.href = 'order-confirmation.html?order=' + encodeURIComponent(orderId);
  };

  // Utility helpers
  function numberFormat(n) { return (Number(n) || 0).toLocaleString('en-IN'); }
  function escapeHtml(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // Small toast
  function showToast(msg) {
    if (window.bootstrap) {
      let toastEl = document.getElementById('pmgToast');
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.id = 'pmgToast';
        toastEl.className = 'position-fixed bottom-0 end-0 p-3';
        toastEl.style.zIndex = 9999;
        toastEl.innerHTML = `
          <div class="toast align-items-center text-white bg-dark border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
              <div class="toast-body">${msg}</div>
              <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
          </div>`;
        document.body.appendChild(toastEl);
      } else {
        toastEl.querySelector('.toast-body').innerText = msg;
      }
      const t = new bootstrap.Toast(toastEl.querySelector('.toast'));
      t.show();
    } else {
      alert(msg);
    }
  }

  // Auto-render if cart page
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('cartBody')) renderCart();
  });

})();
