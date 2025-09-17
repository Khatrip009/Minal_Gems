// assets/js/main.js
(function () {
  const CART_KEY = 'pmg_cart';

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function setCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  function updateCartBadge() {
    const countEl = document.getElementById('cart-count');
    if (!countEl) return;
    const cart = getCart();
    const qty = cart.reduce((s, i) => s + (i.qty || 0), 0);
    countEl.innerText = qty;
  }

  // Expose small API to window
  window.PMG = {
    CART_KEY,
    getCart,
    setCart,
    updateCartBadge
  };

  // init
  document.addEventListener('DOMContentLoaded', updateCartBadge);
})();
