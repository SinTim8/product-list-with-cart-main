
const cart = {};
const dataPath = './data.json';
let products = [];
const MIN_ORDER = 1;
const EMPTY_CARD = 0;
let totalCartQuantity = 0;
function toggleCartButtons (elements, isInSelectionMode) {
    elements.addToCartBtn.classList.toggle('is-hidden', isInSelectionMode);
    elements.qntSelectorBtn.classList.toggle('is-hidden', !isInSelectionMode);
    elements.productImage.classList.toggle('is-border', isInSelectionMode);
}
async function loadData () {
    const response = await fetch(dataPath);
    products = await response.json();
    renderProducts(products);
}
function renderProducts (products) {
    let productCards = document.getElementById('cards');
    productCards.innerHTML = '<h1>Desserts</h1>';
    products.forEach(product => {
        productCards.innerHTML += `
            <article class="product-card">
                <div class="product-image-container">
                  <picture>
                    <source media="(min-width: 1024px)" srcset="${product.image.desktop}">
                    <source media="(min-width: 768px)" srcset="${product.image.tablet}">
                    <img src="${product.image.mobile}" alt="product-image" class="product-image">
                  </picture>
                  <div class="quantity-selector-btn is-hidden">
                    <button class="decrement"></button>
                    <span class="quantity-value">0</span>
                    <button class="increment"></button>
                  </div>
                  <button class="add-to-cart-btn"><img src="./assets/images/icon-add-to-cart.svg" alt="icon-add-to-cart">Add to Cart</button>
                </div>
                <div class="product-info">
                  <p>${product.category}</p>
                  <h3>${product.name}</h3>
                  <span class="price">$${product.price.toFixed(2)}</span>
                </div>
            </article>
        `
    })
};

function getCardElements (cardButton) {
    const parentElement = cardButton.closest('.product-card');
    const addToCartBtn = parentElement.querySelector('.add-to-cart-btn');
    const qntSelectorBtn = parentElement.querySelector('.quantity-selector-btn');
    const qntValue = parentElement.querySelector('.quantity-value');
    const name = parentElement.querySelector('h3').textContent;
    const price = parseFloat(parentElement.querySelector('.price').textContent.replace("$", ''));
    const productImage = parentElement.querySelector('.product-image')
//     const mainSrc = productImage.getAttribute('src');
// // Заменяем "-mobile.jpg", "-tablet.jpg" или "-desktop.jpg" на "-thumbnail.jpg"
//     const thumbnail = mainSrc.replace(/-(mobile|tablet|desktop)\.jpg$/, '-thumbnail.jpg');
    return {addToCartBtn, qntSelectorBtn, qntValue, price, name, productImage};
}

function updateQuantity (elements, change) {
    const newQuantity = parseInt(elements.qntValue.textContent, 10) + change;
    if (newQuantity < 0) return;
    totalCartQuantity += change;
    if (newQuantity > 0) {
        elements.qntValue.textContent = newQuantity;
        const productInfo = products.find(p => p.name === elements.name);
        cart[elements.name] = {'name': elements.name, 'quantity': newQuantity, 'price': elements.price, 'subTotal': newQuantity * elements.price, 'image': productInfo.image.thumbnail};
        toggleCartButtons(elements, true);
    } else {
        elements.qntValue.textContent = 0;
        delete cart[elements.name];
        toggleCartButtons(elements, false);
    }
    updateCartUI();
}

function calculateTotalPrice (obj) {
    let totalPrice = 0;
    for (const item in obj) {
        totalPrice += obj[item].subTotal; 
    }
    return totalPrice.toFixed(2);
}

function updateCartUI () {
    const cartCount = document.getElementById('cart-count');
    const emptyCard = document.querySelector('.cart-empty-state');
    const totalPrice = document.querySelector('.total-amount');
    const cartFooter = document.querySelector('.cart-footer');
    cartCount.textContent = totalCartQuantity;
    emptyCard.classList.toggle('is-hidden', totalCartQuantity > 0);
    cartFooter.classList.toggle('is-hidden', !totalCartQuantity);
    totalPrice.textContent = calculateTotalPrice(cart);
    renderCartList ();
}

function renderCartList () {
    const cartList = document.getElementById('cart-items-list');
    cartList.innerHTML = '';
    for (const name in cart) {
        cartList.innerHTML += `<div class="cart-item">
                                    <div class="cart-item-info">
                                      <p class="cart-item-name">${name}</p>
                                      <div class="cart-item-details">
                                         <span class="order-quantity">${cart[name].quantity}x</span>
                                         <span class="price-per-item">@ $${cart[name].price.toFixed(2)}</span>
                                         <span class="cart-item-subtotal">$${cart[name].subTotal.toFixed(2)}</span>
                                      </div>
                                    </div>
                                    <button class="remove-item-btn" data-name='${name}'></button>
                                </div>`
    }
}

function updateProductCard () {
    const cards = document.querySelectorAll('.product-card');
    for (let card of cards) {
        const elements = getCardElements(card);
        elements.qntValue.textContent = 0;
        toggleCartButtons(elements, false);
    }
}


const cards = document.getElementById('cards');
cards.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn) return;
    const elements = getCardElements(btn);
    if (btn.classList.contains('add-to-cart-btn') || btn.classList.contains('increment')) {
        updateQuantity(elements, 1);
    }
    else if (btn.classList.contains('decrement')) {
        updateQuantity(elements, -1);
    }
            
});

const cartList = document.getElementById('cart-items-list');
cartList.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('button');
    if (!removeBtn) return;
    const item = removeBtn.dataset.name;
    totalCartQuantity -= cart[item].quantity;
    delete cart[item];
    updateCartUI();
    const targetCard = Array.from(document.querySelectorAll('.product-card')).find(card => {
        return getCardElements(card).name === item; 
    });
    if (targetCard) {
       const elements = getCardElements(targetCard);
       elements.qntValue.textContent = 0;
       toggleCartButtons(elements, false); 

    }
});

const confirmBtn = document.getElementById('confirm-order');
confirmBtn.addEventListener('click', (event) => {
    const modal = document.getElementById('order-confirmed-modal');
    const orderItemsList = document.getElementById('order-items-container');
    orderItemsList.innerHTML = '';
    modal.showModal();
    Object.values(cart).forEach(item => {
        orderItemsList.innerHTML += `<div class="order-item-row">
            <img class="thumbnail" src="${item.image}" alt="thumbnail">

            <div class="order-item-details">
              <p class="name">${item.name}</p>
              <div class="price-info">
                <span class="order-quantity">${item.quantity}x</span>
                <span class="price-per-item">@ $${item.price.toFixed(2)}</span>
              </div>
            </div>

            <div class="sub-total-price">$${item.subTotal.toFixed(2)}</div>
          </div>`;
    });
    const modalTotalPrice = document.getElementById('modal-total-price');
    modalTotalPrice.textContent = `$ ${calculateTotalPrice(cart)}`;
});

const newOrderBtn = document.getElementById('new-order-btn');
newOrderBtn.addEventListener('click', (event) => {
    const modal = document.getElementById('order-confirmed-modal');
    Object.keys(cart).forEach(key => delete cart[key]);
    totalCartQuantity = 0;
    updateCartUI();
    updateProductCard();
    modal.close();
});


// Вызываем функцию загрузки
loadData().then(() => {
    // Этот блок выполнится ТОЛЬКО когда данные загрузятся
    console.log("Данные загружены:", products);
    
    // Здесь мы в будущем вызовем функцию отрисовки
    // renderProducts(products);
});
