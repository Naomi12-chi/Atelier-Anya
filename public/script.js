
/* =========================================================
   ATELIER ANYA - ACCOUNT-SPECIFIC CART
   Works with:
   - auth.js
   - shop.js
   - cart.html

   Load auth.js before this file.
   ========================================================= */

(() => {
    "use strict";

    // ========================================
    // CONFIGURATION
    // ========================================

    const CART_KEY_PREFIX = "atelierAnyaCart_";
    const SHIPPING_FEE = 3000;
    const FREE_SHIPPING_THRESHOLD = 50000;

    const LOGIN_PAGE = "./login.html";
    const CART_PAGE = "./cart.html";
    const CHECKOUT_PAGE = "./checkout.html";

    // ========================================
    // AUTHENTICATION HELPERS
    // ========================================

    function getUserId() {
        if (
            window.Auth &&
            typeof window.Auth.getUserId === "function"
        ) {
            const authUserId = window.Auth.getUserId();

            if (authUserId) {
                return String(authUserId);
            }
        }

        const storedId = localStorage.getItem("Id");

        return storedId ? String(storedId) : null;
    }

    function getToken() {
        if (
            window.Auth &&
            typeof window.Auth.getToken === "function"
        ) {
            return window.Auth.getToken();
        }

        return localStorage.getItem("token");
    }

    function isLoggedIn() {
        return Boolean(getToken() && getUserId());
    }

    // ========================================
    // CART STORAGE
    // ========================================

    function getStorageKey() {
        const userId = getUserId();

        if (!userId) {
            return null;
        }

        return `${CART_KEY_PREFIX}${userId}`;
    }

    function readCart() {
        const key = getStorageKey();

        if (!key) {
            return [];
        }

        try {
            const savedCart = localStorage.getItem(key);

            if (!savedCart) {
                return [];
            }

            const parsedCart = JSON.parse(savedCart);

            if (!Array.isArray(parsedCart)) {
                return [];
            }

            return parsedCart
                .filter(item => {
                    return (
                        item &&
                        item.productId &&
                        Number.isInteger(Number(item.quantity)) &&
                        Number(item.quantity) > 0
                    );
                })
                .map(item => ({
                    productId: String(item.productId),
                    name: String(item.name || "Product"),
                    price: Number(item.price) || 0,
                    quantity: Number(item.quantity)
                }));

        } catch (error) {
            console.error(
                "Could not read the saved cart:",
                error
            );

            return [];
        }
    }

    let cart = [];
    let currentCartUserId = null;

    function saveCart() {
        const key = getStorageKey();

        if (!key) {
            console.error(
                "Cannot save cart. No logged-in user was found."
            );

            return false;
        }

        try {
            localStorage.setItem(
                key,
                JSON.stringify(cart)
            );

            return true;

        } catch (error) {
            console.error(
                "Could not save the cart:",
                error
            );

            return false;
        }
    }

    function loadCartForCurrentUser() {
        const userId = getUserId();

        if (!userId) {
            cart = [];
            currentCartUserId = null;

            return;
        }

        currentCartUserId = String(userId);
        cart = readCart();
    }

    // ========================================
    // CART TOTALS
    // ========================================

    function getSubtotal() {
        return cart.reduce(
            (sum, item) => {
                return sum + item.price * item.quantity;
            },
            0
        );
    }

    function getTotalQuantity() {
        return cart.reduce(
            (sum, item) => {
                return sum + item.quantity;
            },
            0
        );
    }

    function getShippingFee() {
        const subtotal = getSubtotal();

        if (
            subtotal === 0 ||
            subtotal >= FREE_SHIPPING_THRESHOLD
        ) {
            return 0;
        }

        return SHIPPING_FEE;
    }

    function getTotal() {
        return getSubtotal() + getShippingFee();
    }

    function formatPrice(amount) {
        return `₦${Number(amount).toLocaleString("en-NG")}`;
    }

    // ========================================
    // CART DISPLAY REFRESH
    // ========================================

    function refreshCartDisplays() {
        displayCart();
        updateCartCount();
        displayFullCart();
        updateFullCartSummary();
        updateEmptyCart();
        updateCartItemCount();
        updateCheckoutButton();
    }

    function refreshForCurrentAccount() {
        const userId = getUserId();

        if (!userId) {
            cart = [];
            currentCartUserId = null;

            refreshCartDisplays();

            return;
        }

        const normalizedUserId = String(userId);

        if (normalizedUserId !== currentCartUserId) {
            loadCartForCurrentUser();
        } else {
            cart = readCart();
        }

        refreshCartDisplays();
    }

    // ========================================
    // LOGIN REDIRECT
    // ========================================

    function requestLogin(returnUrl) {
        const destination =
            returnUrl || window.location.href;

        if (
            window.Auth &&
            typeof window.Auth.redirectToLogin === "function"
        ) {
            window.Auth.redirectToLogin(destination);

            return;
        }

        const loginUrl = new URL(
            LOGIN_PAGE,
            window.location.href
        );

        loginUrl.searchParams.set(
            "returnUrl",
            destination
        );

        window.location.href = loginUrl.href;
    }

    // ========================================
    // ADD ITEM TO CART
    // ========================================

    function addItem(product, quantity = 1) {
        if (!product || !product.productId) {
            console.error(
                "Cannot add product without its product ID:",
                product
            );

            return {
                success: false,
                message: "Product information is incomplete."
            };
        }

        const token = getToken();
        const userId = getUserId();

        const productId = String(product.productId);

        const productName = String(
            product.name || "Product"
        );

        const productPrice = Number(product.price);

        const amount = Math.max(
            1,
            Math.floor(Number(quantity) || 1)
        );

        // ========================================
        // USER NOT LOGGED IN
        // ========================================

        if (!token || !userId) {
            const pendingProduct = {
                productId,
                productName,
                price: Number.isFinite(productPrice)
                    ? productPrice
                    : 0,
                quantity: amount
            };

            try {
                localStorage.setItem(
                    "atelierAnyaPendingCartItem",
                    JSON.stringify(pendingProduct)
                );

            } catch (error) {
                console.error(
                    "Could not save pending cart item:",
                    error
                );
            }

            if (
                window.Auth &&
                typeof window.Auth.savePendingAction === "function"
            ) {
                window.Auth.savePendingAction({
                    type: "ADD_TO_CART",
                    payload: pendingProduct,
                    returnUrl: window.location.href
                });
            }

            requestLogin(window.location.href);

            return {
                success: false,
                requiresLogin: true
            };
        }

        // ========================================
        // LOAD CURRENT USER'S CART
        // ========================================

        const normalizedUserId = String(userId);

        if (normalizedUserId !== currentCartUserId) {
            loadCartForCurrentUser();
        }

        // ========================================
        // FIND EXISTING PRODUCT
        // ========================================

        const existingItem = cart.find(
            item => item.productId === productId
        );

        if (existingItem) {
            existingItem.quantity += amount;

            existingItem.name = productName;

            if (Number.isFinite(productPrice)) {
                existingItem.price = productPrice;
            }

        } else {
            cart.push({
                productId,
                name: productName,
                price: Number.isFinite(productPrice)
                    ? productPrice
                    : 0,
                quantity: amount
            });
        }

        // ========================================
        // SAVE AND REFRESH
        // ========================================

        if (!saveCart()) {
            return {
                success: false,
                message: "Your cart could not be saved."
            };
        }

        refreshCartDisplays();

        return {
            success: true
        };
    }

    // ========================================
    // UPDATE ITEM QUANTITY
    // ========================================

    function setQuantity(productId, quantity) {
        const item = cart.find(
            product => product.productId === String(productId)
        );

        if (!item) {
            return;
        }

        const nextQuantity = Number(quantity);

        if (
            !Number.isInteger(nextQuantity) ||
            nextQuantity < 1
        ) {
            removeItem(productId);

            return;
        }

        item.quantity = nextQuantity;

        saveCart();
        refreshCartDisplays();
    }

    // ========================================
    // REMOVE ITEM
    // ========================================

    function removeItem(productId) {
        cart = cart.filter(
            item => item.productId !== String(productId)
        );

        saveCart();
        refreshCartDisplays();
    }

    // ========================================
    // CHECKOUT
    // ========================================

    function getCheckoutItem(product) {
        return {
            productId: product.productId,
            quantity: product.quantity
        };
    }

    function proceedToCheckout(product) {
        if (!product) {
            return;
        }

        localStorage.setItem(
            "checkoutItem",
            JSON.stringify(
                getCheckoutItem(product)
            )
        );

        if (!isLoggedIn()) {
            requestLogin(CHECKOUT_PAGE);

            return;
        }

        window.location.href = CHECKOUT_PAGE;
    }

    function proceedToFullCheckout() {
        if (cart.length === 0) {
            alert("Your cart is empty.");

            return;
        }

        if (!isLoggedIn()) {
            requestLogin(CHECKOUT_PAGE);

            return;
        }

        localStorage.setItem(
            "checkoutItems",
            JSON.stringify(
                cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                }))
            )
        );

        window.location.href = CHECKOUT_PAGE;
    }

    // ========================================
    // MINI CART
    // ========================================

    function displayCart() {
        const cartItems =
            document.querySelector(".cart-items");

        const cartTotal =
            document.querySelector(".cart-total");

        if (!cartItems) {
            return;
        }

        cartItems.textContent = "";

        cart.forEach(product => {
            const item = document.createElement("div");

            item.className = "cart-item";

            // PRODUCT NAME

            const name = document.createElement("p");

            name.textContent = product.name;

            item.appendChild(name);

            // PRODUCT PRICE

            const price = document.createElement("p");

            price.className = "item-price";

            price.textContent = formatPrice(
                product.price
            );

            item.appendChild(price);

            // QUANTITY

            const quantity = document.createElement("p");

            quantity.className = "item-quantity";

            quantity.textContent =
                `Quantity: ${product.quantity}`;

            item.appendChild(quantity);

            // INCREASE QUANTITY

            const increase = document.createElement("button");

            increase.type = "button";

            increase.className = "quantity-btn";

            increase.textContent = "+";

            increase.addEventListener("click", () => {
                setQuantity(
                    product.productId,
                    product.quantity + 1
                );
            });

            item.appendChild(increase);

            // DECREASE QUANTITY

            const decrease = document.createElement("button");

            decrease.type = "button";

            decrease.className = "quantity-btn";

            decrease.textContent = "-";

            decrease.addEventListener("click", () => {
                setQuantity(
                    product.productId,
                    product.quantity - 1
                );
            });

            item.appendChild(decrease);

            // CHECKOUT BUTTON

            const checkout = document.createElement("button");

            checkout.type = "button";

            checkout.className = "proceed-checkout-btn";

            checkout.textContent = "Checkout";

            checkout.addEventListener("click", () => {
                proceedToCheckout(product);
            });

            item.appendChild(checkout);

            cartItems.appendChild(item);
        });

        if (cartTotal) {
            cartTotal.textContent =
                `Total: ${formatPrice(getSubtotal())}`;
        }
    }

    // ========================================
    // CART ICON COUNT
    // ========================================

    function updateCartCount() {
        const cartCount =
            document.querySelector(".cart-count");

        if (!cartCount) {
            return;
        }

        cartCount.textContent =
            String(getTotalQuantity());
    }

    // ========================================
    // FULL CART ITEM COUNT
    // ========================================

    function updateCartItemCount() {
        const cartItemCount =
            document.querySelector("#cart-item-count");

        if (!cartItemCount) {
            return;
        }

        const totalQuantity = getTotalQuantity();

        cartItemCount.textContent =
            `${totalQuantity} ${
                totalQuantity === 1 ? "item" : "items"
            }`;
    }

    // ========================================
    // FULL CART PAGE
    // ========================================

    function displayFullCart() {
        const fullCartItems =
            document.querySelector("#fullCartItems");

        if (!fullCartItems) {
            return;
        }

        fullCartItems.textContent = "";

        cart.forEach(product => {
            const item = document.createElement("div");

            item.className = "full-cart-item";

            // ========================================
            // PRODUCT INFORMATION
            // ========================================

            const info = document.createElement("div");

            info.className = "cart-product-info";

            const name = document.createElement("h3");

            name.textContent = product.name;

            const price = document.createElement("p");

            price.textContent =
                formatPrice(product.price);

            info.append(name, price);

            // ========================================
            // QUANTITY CONTROLS
            // ========================================

            const quantityControls =
                document.createElement("div");

            quantityControls.className =
                "cart-product-quantity";

            // DECREASE

            const decrease = document.createElement("button");

            decrease.type = "button";

            decrease.className =
                "quantity-btn decrease-full";

            decrease.textContent = "-";

            decrease.setAttribute(
                "aria-label",
                "Decrease quantity"
            );

            decrease.addEventListener("click", () => {
                setQuantity(
                    product.productId,
                    product.quantity - 1
                );
            });

            // CURRENT QUANTITY

            const quantity = document.createElement("span");

            quantity.textContent =
                String(product.quantity);

            // INCREASE

            const increase = document.createElement("button");

            increase.type = "button";

            increase.className =
                "quantity-btn increase-full";

            increase.textContent = "+";

            increase.setAttribute(
                "aria-label",
                "Increase quantity"
            );

            increase.addEventListener("click", () => {
                setQuantity(
                    product.productId,
                    product.quantity + 1
                );
            });

            quantityControls.append(
                decrease,
                quantity,
                increase
            );

            // ========================================
            // LINE TOTAL
            // ========================================

            const lineTotal = document.createElement("div");

            lineTotal.className = "cart-product-total";

            lineTotal.textContent = formatPrice(
                product.price * product.quantity
            );

            // ========================================
            // REMOVE BUTTON
            // ========================================

            const remove = document.createElement("button");

            remove.type = "button";

            remove.className = "remove-item";

            remove.textContent = "Remove";

            remove.addEventListener("click", () => {
                removeItem(product.productId);
            });

            // ========================================
            // CHECKOUT BUTTON
            // ========================================

            const checkout = document.createElement("button");

            checkout.type = "button";

            checkout.className =
                "proceed-checkout-btn";

            checkout.textContent =
                "Proceed to Checkout";

            checkout.addEventListener("click", () => {
                proceedToCheckout(product);
            });

            // ========================================
            // APPEND CART ITEM
            // ========================================

            item.append(
                info,
                quantityControls,
                lineTotal,
                remove,
                checkout
            );

            fullCartItems.appendChild(item);
        });
    }

    // ========================================
    // CART SUMMARY
    // ========================================

    function updateFullCartSummary() {
        const subtotalElement =
            document.querySelector("#cart-subtotal");

        const shippingElement =
            document.querySelector("#cart-shipping");

        const totalElement =
            document.querySelector("#cart-total");

        const subtotal = getSubtotal();

        const shipping = getShippingFee();

        const total = subtotal + shipping;

        if (subtotalElement) {
            subtotalElement.textContent =
                formatPrice(subtotal);
        }

        if (shippingElement) {
            shippingElement.textContent =
                shipping === 0
                    ? "Free"
                    : formatPrice(shipping);
        }

        if (totalElement) {
            totalElement.textContent =
                formatPrice(total);
        }
    }

    // ========================================
    // EMPTY CART MESSAGE
    // ========================================

    function updateEmptyCart() {
        const fullCartItems =
            document.querySelector("#fullCartItems");

        const emptyCart =
            document.querySelector("#emptyCart");

        if (!fullCartItems || !emptyCart) {
            return;
        }

        const isEmpty = cart.length === 0;

        emptyCart.style.display =
            isEmpty ? "flex" : "none";

        fullCartItems.style.display =
            isEmpty ? "none" : "block";
    }

    // ========================================
    // MAIN CHECKOUT BUTTON
    // ========================================

    function updateCheckoutButton() {
        const checkoutButton =
            document.querySelector("#proceedCheckout");

        if (!checkoutButton) {
            return;
        }

        checkoutButton.disabled =
            cart.length === 0;

        checkoutButton.style.opacity =
            cart.length === 0 ? "0.5" : "1";

        checkoutButton.style.cursor =
            cart.length === 0 ? "not-allowed" : "pointer";
    }

    function initializeCheckoutButton() {
        const checkoutButton =
            document.querySelector("#proceedCheckout");

        if (!checkoutButton) {
            return;
        }

        checkoutButton.addEventListener("click", () => {
            proceedToFullCheckout();
        });
    }

    // ========================================
    // PUBLIC CART METHODS
    // ========================================

    window.AtelierCart = {
        addItem,

        getItems: () => {
            return cart.map(item => ({ ...item }));
        },

        getSubtotal,

        getShippingFee,

        getTotal,

        refresh: refreshForCurrentAccount,

        save: saveCart,

        updateDisplays: refreshCartDisplays
    };

    // ========================================
    // MINI CART OPEN / CLOSE
    // ========================================

    function initializeCartPage() {
        const cartIcon =
            document.querySelector(".cart-icon");

        const cartPanel =
            document.querySelector(".cart-panel");

        // OPEN MINI CART

        if (cartIcon && cartPanel) {
            cartIcon.addEventListener("click", event => {
                event.preventDefault();

                cartPanel.classList.add("active");
            });

            // PREVENT CLOSING WHEN CLICKING INSIDE

            cartPanel.addEventListener("click", event => {
                event.stopPropagation();
            });

            // CLOSE WHEN CLICKING OUTSIDE

            document.addEventListener("click", event => {
                if (
                    !cartPanel.contains(event.target) &&
                    !cartIcon.contains(event.target)
                ) {
                    cartPanel.classList.remove("active");
                }
            });
        }

        // LOAD CART

        loadCartForCurrentUser();

        // INITIALIZE MAIN CHECKOUT

        initializeCheckoutButton();

        // DISPLAY CART

        refreshCartDisplays();
    }

    // ========================================
    // INITIALIZE AFTER DOM LOAD
    // ========================================

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeCartPage,
            { once: true }
        );

    } else {
        initializeCartPage();
    }

    // ========================================
    // REFRESH WHEN RETURNING TO PAGE
    // ========================================

    window.addEventListener(
        "focus",
        refreshForCurrentAccount
    );

    // ========================================
    // REFRESH WHEN AUTH CHANGES
    // ========================================

    window.addEventListener(
        "storage",
        event => {
            if (
                event.key === "Id" ||
                event.key === "token"
            ) {
                refreshForCurrentAccount();
            }
        }
    );

})();
