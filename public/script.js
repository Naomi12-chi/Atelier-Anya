/* =========================================================
   ATELIER ANYA - ACCOUNT-SPECIFIC CART
   Load this file before shop.js on the shop page.
   ========================================================= */

(() => {
    "use strict";

    const CART_KEY_PREFIX = "atelierAnyaCart_";
    const SHIPPING_FEE = 3000;
    const FREE_SHIPPING_THRESHOLD = 50000;

    function getUserId() {
        if (window.Auth && typeof window.Auth.getUserId === "function") {
            const authUserId = window.Auth.getUserId();
            if (authUserId) return String(authUserId);
        }

        const storedId = localStorage.getItem("Id");
        return storedId ? String(storedId) : null;
    }

    function getToken() {
        if (window.Auth && typeof window.Auth.getToken === "function") {
            return window.Auth.getToken();
        }
        return localStorage.getItem("token");
    }

    function getStorageKey() {
        const userId = getUserId();
        return userId ? `${CART_KEY_PREFIX}${userId}` : null;
    }

    function readCart() {
        const key = getStorageKey();
        if (!key) return [];

        try {
            const parsed = JSON.parse(localStorage.getItem(key) || "[]");
            if (!Array.isArray(parsed)) return [];

            return parsed.filter(item =>
                item &&
                typeof item.productId === "string" &&
                item.productId.trim() !== "" &&
                Number.isInteger(Number(item.quantity)) &&
                Number(item.quantity) > 0
            ).map(item => ({
                productId: item.productId,
                name: String(item.name || "Product"),
                price: Number(item.price) || 0,
                quantity: Number(item.quantity)
            }));
        } catch (error) {
            console.error("Could not read the saved cart:", error);
            return [];
        }
    }

    let cart = readCart();

    function saveCart() {
        const key = getStorageKey();

        if (!key) {
            cart = [];
            return false;
        }

        try {
            localStorage.setItem(key, JSON.stringify(cart));
            return true;
        } catch (error) {
            console.error("Could not save the cart:", error);
            return false;
        }
    }

    function refreshCartDisplays() {
        displayCart();
        updateCartCount();
        displayFullCart();
        updateFullCartSummary();
        updateEmptyCart();
    }

    function getLoginUrl() {
        return "./login.html";
    }

    function requestLogin(returnUrl) {
        if (window.Auth && typeof window.Auth.savePendingAction === "function") {
            window.Auth.redirectToLogin(returnUrl || window.location.href);
        } else {
            const target = new URL(getLoginUrl(), window.location.href);
            target.searchParams.set(
                "returnUrl",
                returnUrl || window.location.href
            );
            window.location.href = target.href;
        }
    }

    function addItem(product, quantity = 1) {
        if (!product || !product.productId) {
            console.error(
                "Cannot add product without its MongoDB product ID.",
                product
            );

            return {
                success: false,
                message: "Product information is incomplete."
            };
        }

        const token = getToken();
        const userId = getUserId();

        if (!token || !userId) {
            const pendingProduct = {
                productId: String(product.productId),
                productName: String(product.name || "Product"),
                price: Number(product.price) || 0,
                quantity: Math.max(1, Number(quantity) || 1)
            };

            localStorage.setItem(
                "atelierAnyaPendingCartItem",
                JSON.stringify(pendingProduct)
            );

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

        const activeKey = getStorageKey();

        if (!activeKey) {
            return {
                success: false,
                message: "Please sign in again."
            };
        }

        cart = readCart();

        const productId = String(product.productId);
        const amount = Math.max(1, Number(quantity) || 1);

        const existing = cart.find(
            item => item.productId === productId
        );

        if (existing) {
            existing.quantity += amount;
            existing.name = String(product.name || existing.name);
            existing.price = Number(product.price) || existing.price;
        } else {
            cart.push({
                productId,
                name: String(product.name || "Product"),
                price: Number(product.price) || 0,
                quantity: amount
            });
        }

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

    function setQuantity(productId, quantity) {
        const item = cart.find(
            product => product.productId === productId
        );

        if (!item) return;

        const nextQuantity = Number(quantity);

        if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
            removeItem(productId);
            return;
        }

        item.quantity = nextQuantity;

        saveCart();
        refreshCartDisplays();
    }

    function removeItem(productId) {
        cart = cart.filter(
            item => item.productId !== productId
        );

        saveCart();
        refreshCartDisplays();
    }

    function getCheckoutItem(product) {
        return {
            productId: product.productId,
            quantity: product.quantity
        };
    }

    function proceedToCheckout(product) {
        localStorage.setItem(
            "checkoutItem",
            JSON.stringify(getCheckoutItem(product))
        );

        const token = getToken();
        const userId = getUserId();

        if (!token || !userId) {
            requestLogin("./checkout.html");
            return;
        }

        window.location.href = "./checkout.html";
    }

    // MINI CART
    function displayCart() {
        const cartItems = document.querySelector(".cart-items");
        const cartTotal = document.querySelector(".cart-total");

        if (!cartItems) return;

        cartItems.textContent = "";

        let total = 0;

        cart.forEach(product => {
            const item = document.createElement("div");
            item.className = "cart-item";

            const name = document.createElement("p");
            name.textContent = product.name;
            item.appendChild(name);

            const price = document.createElement("p");
            price.className = "item-price";
            price.textContent =
                `₦${product.price.toLocaleString()}`;

            item.appendChild(price);

            const quantity = document.createElement("p");
            quantity.className = "item-quantity";
            quantity.textContent =
                `Quantity: ${product.quantity}`;

            item.appendChild(quantity);

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

            const checkout = document.createElement("button");
            checkout.type = "button";
            checkout.className = "proceed-checkout-btn";
            checkout.textContent = "Checkout";

            checkout.addEventListener("click", () => {
                proceedToCheckout(product);
            });

            item.appendChild(checkout);
            cartItems.appendChild(item);

            total += product.price * product.quantity;
        });

        if (cartTotal) {
            cartTotal.textContent =
                `Total: ₦${total.toLocaleString()}`;
        }
    }

    // CART COUNT
    function updateCartCount() {
        const cartCount = document.querySelector(".cart-count");

        if (!cartCount) return;

        cartCount.textContent = cart.reduce(
            (sum, item) => sum + item.quantity,
            0
        );
    }

    // FULL CART PAGE
    function displayFullCart() {
        const fullCartItems =
            document.querySelector("#fullCartItems");

        if (!fullCartItems) return;

        fullCartItems.textContent = "";

        cart.forEach(product => {
            const item = document.createElement("div");
            item.className = "full-cart-item";

            const info = document.createElement("div");
            info.className = "cart-product-info";

            const name = document.createElement("h3");
            name.textContent = product.name;

            const price = document.createElement("p");
            price.textContent =
                `₦${product.price.toLocaleString()}`;

            info.append(name, price);

            const quantityControls =
                document.createElement("div");

            quantityControls.className =
                "cart-product-quantity";

            const decrease = document.createElement("button");
            decrease.type = "button";
            decrease.className = "quantity-btn decrease-full";
            decrease.textContent = "-";

            decrease.addEventListener("click", () => {
                setQuantity(
                    product.productId,
                    product.quantity - 1
                );
            });

            const quantity = document.createElement("span");
            quantity.textContent = String(product.quantity);

            const increase = document.createElement("button");
            increase.type = "button";
            increase.className = "quantity-btn increase-full";
            increase.textContent = "+";

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

            const lineTotal = document.createElement("div");
            lineTotal.className = "cart-product-total";

            lineTotal.textContent =
                `₦${(
                    product.price * product.quantity
                ).toLocaleString()}`;

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "remove-item";
            remove.textContent = "Remove";

            remove.addEventListener("click", () => {
                removeItem(product.productId);
            });

            const checkout = document.createElement("button");
            checkout.type = "button";
            checkout.className = "proceed-checkout-btn";
            checkout.textContent = "Proceed to Checkout";

            checkout.addEventListener("click", () => {
                proceedToCheckout(product);
            });

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

    // CART SUMMARY
    function updateFullCartSummary() {
        const subtotalElement =
            document.querySelector("#cart-subtotal");

        const shippingElement =
            document.querySelector("#cart-shipping");

        const totalElement =
            document.querySelector("#cart-total");

        const subtotal = cart.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        const shipping =
            subtotal === 0 ||
            subtotal >= FREE_SHIPPING_THRESHOLD
                ? 0
                : SHIPPING_FEE;

        if (subtotalElement) {
            subtotalElement.textContent =
                `₦${subtotal.toLocaleString()}`;
        }

        if (shippingElement) {
            shippingElement.textContent =
                shipping === 0
                    ? "Free"
                    : `₦${shipping.toLocaleString()}`;
        }

        if (totalElement) {
            totalElement.textContent =
                `₦${(subtotal + shipping).toLocaleString()}`;
        }
    }

    // EMPTY CART
    function updateEmptyCart() {
        const fullCartItems =
            document.querySelector("#fullCartItems");

        const emptyCart =
            document.querySelector("#emptyCart");

        if (!fullCartItems || !emptyCart) return;

        const isEmpty = cart.length === 0;

        emptyCart.style.display =
            isEmpty ? "flex" : "none";

        fullCartItems.style.display =
            isEmpty ? "none" : "block";
    }

    function refreshForCurrentAccount() {
        cart = readCart();
        refreshCartDisplays();
    }

    // PUBLIC CART METHODS
    window.AtelierCart = {
        addItem,

        getItems: () =>
            cart.map(item => ({ ...item })),

        refresh: refreshForCurrentAccount,

        save: saveCart,

        updateDisplays: refreshCartDisplays
    };

    // MINI CART OPEN/CLOSE
    function initializeCartPage() {
        const cartIcon =
            document.querySelector(".cart-icon");

        const cartPanel =
            document.querySelector(".cart-panel");

        if (cartIcon && cartPanel) {
            cartIcon.addEventListener("click", () => {
                cartPanel.classList.add("active");
            });

            cartPanel.addEventListener("click", event => {
                event.stopPropagation();
            });

            document.addEventListener("click", event => {
                if (
                    !cartPanel.contains(event.target) &&
                    !cartIcon.contains(event.target)
                ) {
                    cartPanel.classList.remove("active");
                }
            });
        }

        refreshForCurrentAccount();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeCartPage,
            { once: true }
        );
    } else {
        initializeCartPage();
    }

    window.addEventListener(
        "focus",
        refreshForCurrentAccount
    );

})();