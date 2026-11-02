// ========================================
// CHECKOUT AUTHENTICATION
// ========================================

function getCheckoutItem() {
    try {
        return JSON.parse(localStorage.getItem("checkoutItem") || "null");
    } catch (error) {
        console.error("Invalid checkout item in localStorage:", error);
        return null;
    }
}

function redirectToLoginForCheckout() {
    const checkoutItem = getCheckoutItem();

    if (!checkoutItem || !checkoutItem.productId || !checkoutItem.quantity) {
        alert("Your checkout details are missing. Please select a product again.");
        window.location.href = "./cart.html";
        return;
    }

    // Save the checkout action so the login page knows where to return.
    if (window.Auth && typeof window.Auth.savePendingAction === "function") {
        window.Auth.savePendingAction({
            type: "CHECKOUT",
            payload: {
                checkoutItem: checkoutItem
            },
            returnUrl: window.location.href
        });

        window.Auth.redirectToLogin(window.location.href);
    } else {
        // Safe fallback if centralized Auth is unavailable.
        sessionStorage.setItem("authReturnUrl", window.location.href);
        window.location.href = "./login.html";
    }
}

async function ensureAuthForCheckout() {
    const token = window.Auth && typeof window.Auth.getToken === "function"
        ? window.Auth.getToken()
        : localStorage.getItem("token");

    if (!token) {
        redirectToLoginForCheckout();
        return false;
    }

    return true;
}


// ========================================
// CHECKOUT ELEMENTS AND DATA
// ========================================

const checkoutItem = getCheckoutItem();

const checkoutForm = document.getElementById("checkoutForm");
const placeOrderButton = document.getElementById("placeOrderButton");

const checkoutItems = document.getElementById("checkoutItems");
const checkoutItemCount = document.getElementById("checkoutItemCount");
const checkoutSubtotal = document.getElementById("checkoutSubtotal");
const checkoutShipping = document.getElementById("checkoutShipping");
const checkoutTotal = document.getElementById("checkoutTotal");

let selectedProduct = null;
let isSubmittingOrder = false;


// ========================================
// SAFE RESPONSE PARSING
// ========================================

async function readResponseData(response) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return response.json();
    }

    return response.text();
}

function getResponseMessage(data, fallbackMessage) {
    if (typeof data === "string" && data.trim()) {
        return data;
    }

    if (data && typeof data === "object") {
        return data.message || data.error || fallbackMessage;
    }

    return fallbackMessage;
}


// ========================================
// LOAD SELECTED PRODUCT
// ========================================

async function loadCheckoutItem() {
    if (
        !checkoutItem ||
        !checkoutItem.productId ||
        !Number.isInteger(Number(checkoutItem.quantity)) ||
        Number(checkoutItem.quantity) <= 0
    ) {
        alert("No valid product was selected for checkout.");
        window.location.href = "./cart.html";
        return;
    }

    try {
        const response = await fetch("products/allProducts");

        if (!response.ok) {
            throw new Error("Unable to retrieve products.");
        }

        const products = await response.json();

        if (!Array.isArray(products)) {
            throw new Error("The product response was not valid.");
        }

        selectedProduct = products.find(
            product => product._id === checkoutItem.productId
        );

        if (!selectedProduct) {
            alert("This product could not be found. Please select it again.");
            window.location.href = "./cart.html";
            return;
        }

        if (
            typeof selectedProduct.price !== "number" ||
            !Number.isFinite(selectedProduct.price) ||
            selectedProduct.price < 0
        ) {
            throw new Error("The product price is invalid.");
        }

        displayCheckoutItem();

    } catch (error) {
        console.error("Checkout loading error:", error);
        alert(error.message || "Unable to load your checkout details.");
    }
}


// ========================================
// DISPLAY SELECTED PRODUCT
// ========================================

function displayCheckoutItem() {
    if (
        !selectedProduct ||
        !checkoutItems ||
        !checkoutItemCount ||
        !checkoutSubtotal ||
        !checkoutShipping ||
        !checkoutTotal
    ) {
        console.error("One or more checkout display elements are missing.");
        return;
    }

    const quantity = Number(checkoutItem.quantity);
    const subtotal = selectedProduct.price * quantity;

    checkoutItems.innerHTML = "";

    const productContainer = document.createElement("div");
    productContainer.classList.add("checkout-product");

    const productName = document.createElement("h3");
    productName.textContent = selectedProduct.name || "Product";

    const productQuantity = document.createElement("p");
    productQuantity.textContent = `Quantity: ${quantity}`;

    const productPrice = document.createElement("p");
    productPrice.textContent =
        `Price: ₦${selectedProduct.price.toLocaleString()}`;

    const productSubtotal = document.createElement("p");
    productSubtotal.textContent =
        `Subtotal: ₦${subtotal.toLocaleString()}`;

    productContainer.append(
        productName,
        productQuantity,
        productPrice,
        productSubtotal
    );

    checkoutItems.appendChild(productContainer);

    checkoutItemCount.textContent = `${quantity} item(s)`;
    checkoutSubtotal.textContent = `₦${subtotal.toLocaleString()}`;

    // Shipping and final total must be confirmed by the backend/business rules.
    checkoutShipping.textContent = "To be confirmed";
    checkoutTotal.textContent = "To be confirmed";
}


// ========================================
// CREATE ORDER
// ========================================

if (checkoutForm) {
    checkoutForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isSubmittingOrder) {
            return;
        }

        const isAuthenticated = await ensureAuthForCheckout();

        if (!isAuthenticated) {
            return;
        }

        const token = window.Auth && typeof window.Auth.getToken === "function"
            ? window.Auth.getToken()
            : localStorage.getItem("token");

        if (!token) {
            redirectToLoginForCheckout();
            return;
        }

        if (!selectedProduct || !checkoutItem) {
            alert("Product details are not available. Please reload checkout.");
            return;
        }

        const addressInput = document.getElementById("shippingAddress");
        const cityInput = document.getElementById("city");
        const stateInput = document.getElementById("state");

        if (!addressInput || !cityInput || !stateInput) {
            alert("Some shipping address fields are missing.");
            return;
        }

        const address = addressInput.value.trim();
        const city = cityInput.value.trim();
        const state = stateInput.value.trim();

        if (!address || !city || !state) {
            alert("Please complete your shipping address.");
            return;
        }

        const shippingAddress = [address, city, state].join(", ");

        // Do not send a price or total as authoritative.
        // The backend must calculate the final amount from its database.
        const orderData = {
            items: [
                {
                    productId: checkoutItem.productId,
                    name: selectedProduct.name,
                    quantity: Number(checkoutItem.quantity)
                }
            ],
            shippingAddress
        };

        isSubmittingOrder = true;

        if (placeOrderButton) {
            placeOrderButton.disabled = true;
            placeOrderButton.textContent = "Processing...";
        }

        try {
            const response = await fetch("orders/createOrder", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            const data = await readResponseData(response);

            // Only redirect to login for an authentication failure.
            if (response.status === 401) {
                redirectToLoginForCheckout();
                return;
            }

            // A 403 may mean permission denied, not necessarily expired login.
            if (response.status === 403) {
                throw new Error(
                    getResponseMessage(
                        data,
                        "You are not authorized to place this order."
                    )
                );
            }

            if (!response.ok) {
                throw new Error(
                    getResponseMessage(data, "Unable to create your order.")
                );
            }

            alert(
                getResponseMessage(
                    data,
                    "Your order has been placed successfully."
                )
            );

            localStorage.removeItem("checkoutItem");

            window.location.href = "./myOrder.html";

        } catch (error) {
            console.error("Order creation error:", error);

            alert(
                error.message ||
                "Something went wrong while creating your order."
            );

        } finally {
            isSubmittingOrder = false;

            if (placeOrderButton) {
                placeOrderButton.disabled = false;
                placeOrderButton.innerHTML =
                    'Place Order <i class="fa-solid fa-arrow-right"></i>';
            }
        }
    });
} else {
    console.error("Checkout form #checkoutForm was not found.");
}


// ========================================
// INITIALIZE CHECKOUT
// ========================================

loadCheckoutItem();