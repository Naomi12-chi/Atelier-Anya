
const savedCart = localStorage.getItem("cart");

let cart = savedCart ? JSON.parse(savedCart) : [];

const addToCartButtons = document.querySelectorAll(".product-action");

const cartCount = document.querySelector(".cart-count");

const cartIcon = document.querySelector(".cart-icon");

const cartPanel = document.querySelector(".cart-panel");

const cartItems = document.querySelector(".cart-items");

const cartTotal = document.querySelector(".cart-total");



function displayCart() {

    if (!cartItems) {
        return;
    }

    cartItems.innerHTML = "";

    let total = 0;

    cart.forEach((product) => {

        const cartItem = document.createElement("div");

        cartItem.classList.add("cart-item");

        cartItem.textContent = product.name;

        cartItems.appendChild(cartItem);

        const price = document.createElement("p");

        price.classList.add("item-price");

        price.textContent = `₦${product.price.toLocaleString()}`;

        cartItem.appendChild(price);

        const productQuantity = document.createElement("p");

        productQuantity.classList.add("item-quantity");

        productQuantity.textContent = `Quantity: ${product.quantity}`;

        cartItem.appendChild(productQuantity);

        const increaseButton = document.createElement("button");

        increaseButton.textContent = "+";

        increaseButton.classList.add("quantity-btn");

        cartItem.appendChild(increaseButton);

        increaseButton.addEventListener("click", () => {

            product.quantity++;

            localStorage.setItem("cart", JSON.stringify(cart));

            displayCart();

            updateCartCount();

        });

        const decreaseButton = document.createElement("button");

        decreaseButton.textContent = "-";

        decreaseButton.classList.add("quantity-btn");

        cartItem.appendChild(decreaseButton);

        decreaseButton.addEventListener("click", () => {

            if (product.quantity > 0) {
                product.quantity--;
            }

            if (product.quantity === 0) {

                const productIndex = cart.findIndex((item) => item === product);

                cart.splice(productIndex, 1);

            }

            localStorage.setItem("cart", JSON.stringify(cart));

            displayCart();

            updateCartCount();

        });

        // Individual checkout button
        const checkoutButton = document.createElement("button");

        checkoutButton.textContent = "Checkout";

        checkoutButton.classList.add("proceed-checkout-btn");

        cartItem.appendChild(checkoutButton);

        checkoutButton.addEventListener("click", () => {

            const checkoutItem = {
                productId: product.productId,
                quantity: product.quantity
            };

            localStorage.setItem("checkoutItem", JSON.stringify(checkoutItem));

            window.location.href = "./checkout.html";

        });

        total += product.price * product.quantity;

    });

    if (cartTotal) {
        cartTotal.textContent = `Total: ₦${total.toLocaleString()}`;
    }

}



if (cartIcon && cartPanel) {

    cartIcon.addEventListener("click", () => {

        cartPanel.classList.add("active");

    });

    cartPanel.addEventListener("click", (event) => {

        event.stopPropagation();

    });

    document.addEventListener("click", (event) => {

        if (
            !cartPanel.contains(event.target) &&
            !cartIcon.contains(event.target)
        ) {

            cartPanel.classList.remove("active");

        }

    });

}


addToCartButtons.forEach((button) => {

    button.addEventListener("click", async () => {

        const isAuthenticated = await checkAuthentication();

        if (!isAuthenticated) return;

        const token = localStorage.getItem("token");

        const productCard = button.closest(".product-card");

        const productName = productCard.querySelector("h3").textContent;

        const productPrice = parseInt(
            productCard.querySelector(".product-price").textContent.replace(/[^\d]/g, "")
        );

        const product = {

            name: productName,

            price: productPrice,

            quantity: 1

        };

        const existingProduct = cart.find((item) => item.name === product.name);

        if (existingProduct) {

            existingProduct.quantity++;

        } else {

            cart.push(product);

        }

        localStorage.setItem("cart", JSON.stringify(cart));

        displayCart();

        updateCartCount();

    });

});


function updateCartCount() {

    let count = 0;

    cart.forEach((product) => {

        count += product.quantity;

    });

    if (cartCount) {
        cartCount.textContent = count;
    }

}


function displayFullCart() {

    const fullCartItems = document.querySelector("#fullCartItems");

    if (!fullCartItems) {
        return;
    }

    updateEmptyCart();

    const emptyCart = document.querySelector("#emptyCart");

    if (emptyCart) {

        emptyCart.style.display = cart.length === 0 ? "flex" : "none";

    }

    fullCartItems.innerHTML = "";

    cart.forEach((product) => {

        const cartItem = document.createElement("div");

        cartItem.classList.add("full-cart-item");

        cartItem.innerHTML = `
            <div class="cart-product-info">
                <h3>${product.name}</h3>
                <p>₦${product.price.toLocaleString()}</p>
            </div>

            <div class="cart-product-quantity">

                <button class="quantity-btn decrease-full">
                    -
                </button>

                <span>${product.quantity}</span>

                <button class="quantity-btn increase-full">
                    +
                </button>

            </div>

            <div class="cart-product-total">
                ₦${(product.price * product.quantity).toLocaleString()}
            </div>

            <button class="remove-item">
                Remove
            </button>

            <button class="proceed-checkout-btn">
                Proceed to Checkout
            </button>
        `;

        fullCartItems.appendChild(cartItem);


        // Individual product checkout

        const proceedButton = cartItem.querySelector(".proceed-checkout-btn");

        proceedButton.addEventListener("click", () => {

            localStorage.setItem("checkoutItem", JSON.stringify(product));

            window.location.href = "./checkout.html";

        });


        // Increase quantity

        const increaseButton = cartItem.querySelector(".increase-full");

        increaseButton.addEventListener("click", () => {

            product.quantity++;

            localStorage.setItem("cart", JSON.stringify(cart));

            displayFullCart();

            displayCart();

            updateCartCount();

            updateFullCartSummary();

            updateEmptyCart();

        });


        // Decrease quantity

        const decreaseButton = cartItem.querySelector(".decrease-full");

        decreaseButton.addEventListener("click", () => {

            if (product.quantity > 0) {

                product.quantity--;

            }

            if (product.quantity === 0) {

                const productIndex = cart.findIndex((item) => item === product);

                cart.splice(productIndex, 1);

            }

            localStorage.setItem("cart", JSON.stringify(cart));

            displayFullCart();

            displayCart();

            updateCartCount();

            updateFullCartSummary();

            updateEmptyCart();

        });


        // Remove item

        const removeButton = cartItem.querySelector(".remove-item");

        removeButton.addEventListener("click", () => {

            const productIndex = cart.findIndex((item) => item === product);

            cart.splice(productIndex, 1);

            localStorage.setItem("cart", JSON.stringify(cart));

            displayFullCart();

            displayCart();

            updateCartCount();

            updateFullCartSummary();

            updateEmptyCart();

        });

    });

}


// Authentication check

async function checkAuthentication() {

    const Id = localStorage.getItem("Id");

    const token = localStorage.getItem("token");

    if (!token) {

        window.location.href = "../login.html";

        return false;

    }

    const response = await fetch(`/user/myAccount/${Id}`, {

        method: "GET",

        headers: {

            Authorization: `bearer ${token}`

        }

    });

    if (response.status === 401 || response.status === 403) {

        window.location.href = "../login.html";

        return false;

    }

    return response.ok;

}


// Display cart when page loads

displayCart();

updateCartCount();

displayFullCart();


// Update cart summary

function updateFullCartSummary() {

    const cartSubtotal = document.querySelector("#cart-subtotal");

    const cartShipping = document.querySelector("#cart-shipping");

    const cartTotal = document.querySelector("#cart-total");

    let subtotal = 0;

    cart.forEach((product) => {

        subtotal += product.price * product.quantity;

    });


    // Shipping

    let shipping = 3000;

    if (subtotal >= 50000 || subtotal === 0) {

        shipping = 0;

    }


    // Total

    const total = subtotal + shipping;


    // Display subtotal

    if (cartSubtotal) {

        cartSubtotal.textContent = `₦${subtotal.toLocaleString()}`;

    }


    // Display shipping

    if (cartShipping) {

        if (shipping === 0) {

            cartShipping.textContent = "Free";

        } else {

            cartShipping.textContent = `₦${shipping.toLocaleString()}`;

        }

    }


    // Display total

    if (cartTotal) {

        cartTotal.textContent = `₦${total.toLocaleString()}`;

    }

}


// Update summary when page loads

updateFullCartSummary();


// Empty cart display

function updateEmptyCart() {

    const fullCartItems = document.querySelector("#fullCartItems");

    const emptyCart = document.querySelector("#emptyCart");

    if (!fullCartItems || !emptyCart) {

        return;

    }

    if (cart.length === 0) {

        emptyCart.style.display = "flex";

        fullCartItems.style.display = "none";

    } else {

        emptyCart.style.display = "none";

        fullCartItems.style.display = "block";

    }

}

updateEmptyCart();
