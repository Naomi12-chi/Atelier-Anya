
// ========================================
// AUTHENTICATION
// ========================================

function ensureAuthForOrders() {
    if (window.Auth) {
        const token = window.Auth.getToken();
        const Id = window.Auth.getUserId();

        if (!Id || !token) {
            window.Auth.savePendingAction({
                type: "VIEW_ORDERS",
                returnUrl: window.location.href
            });

            window.Auth.redirectToLogin(window.location.href);
            return false;
        }

        return { token, Id };
    }

    const Id = localStorage.getItem("Id");
    const token = localStorage.getItem("token");

    if (!Id || !token) {
        window.location.href = "login.html";
        return false;
    }

    return { token, Id };
}

// ========================================
// DOM ELEMENTS
// ========================================

const orderFilter = document.getElementById("orderFilter");
const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");
const ordersContainer = document.getElementById("ordersContainer");
const emptyOrders = document.getElementById("emptyOrders");

const orderDetailsSection = document.getElementById("orderDetailsSection");
const closeOrderDetails = document.getElementById("closeOrderDetails");

const orderReference = document.getElementById("orderReference");
const orderDate = document.getElementById("orderDate");
const orderStatus = document.getElementById("orderStatus");
const orderPaymentStatus = document.getElementById("orderPaymentStatus");
const orderDetailsItems = document.getElementById("orderDetailsItems");
const orderShippingAddress = document.getElementById("orderShippingAddress");
const orderTotal = document.getElementById("orderTotal");

const shippingEditForm = document.getElementById("shippingEditForm");
const shippingAddressInput = document.getElementById("input-shippingAddress");

const cancelOrderButton = document.getElementById("cancelOrderButton");

// ========================================
// GLOBAL VARIABLES
// ========================================

let allOrders = [];
let currentOrderId = null;

// ========================================
// HELPER FUNCTIONS
// ========================================

const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 2
    }).format(Number(amount) || 0);
};

function escapeHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]
    );
}

function formatDate(date) {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function getProductId(item) {
    return String(item.productId?._id ?? item.productId ?? "");
}

// ========================================
// GET CUSTOMER ORDERS
// ========================================

async function getMyOrders() {
    const auth = ensureAuthForOrders();

    if (!auth) return;

    const { Id, token } = auth;

    loadingMessage.hidden = false;
    errorMessage.hidden = true;
    emptyOrders.hidden = true;
    ordersContainer.innerHTML = "";

    try {
        const response = await fetch(
            `/orders/myOrders/${encodeURIComponent(Id)}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to retrieve your orders.");
        }

        const orders = Array.isArray(data) ? data : data.orders;

        if (!Array.isArray(orders)) {
            throw new Error("The server returned an invalid orders response.");
        }

        allOrders = orders;

        if (allOrders.length === 0) {
            emptyOrders.hidden = false;
            return;
        }

        displayOrders(allOrders);

    } catch (error) {
        console.error("Get orders error:", error);

        errorMessage.textContent =
            error.message || "Something went wrong. Please try again.";

        errorMessage.hidden = false;

    } finally {
        loadingMessage.hidden = true;
    }
}

// ========================================
// DISPLAY ORDERS
// ========================================

function displayOrders(orders) {
    ordersContainer.innerHTML = "";
    emptyOrders.hidden = true;

    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="no-filter-results">
                <h3>No matching orders</h3>
                <p>There are no orders with this status.</p>
            </div>
        `;
        return;
    }

    let ordersHTML = "";

    orders.forEach((order, index) => {
        const status = String(
            order.orderStatus ?? order.status ?? "pending"
        ).toLowerCase();

        const items = Array.isArray(order.items) ? order.items : [];

        ordersHTML += `
            <article class="order-card">

                <div class="order-header">
                    <div>
                        <p class="order-label">ORDER ${index + 1}</p>
                        <p class="order-date">
                            ${formatDate(order.createdAt)}
                        </p>
                    </div>

                    <span class="order-status status-${escapeHTML(status)}">
                        ${escapeHTML(status)}
                    </span>
                </div>

                <div class="order-items">
                    ${items.map(item => `
                        <div class="order-item">
                            <div class="item-details">
                                <h3>${escapeHTML(item.name)}</h3>
                                <p>Quantity: ${escapeHTML(item.quantity)}</p>
                            </div>

                            <p class="item-price">
                                ${formatPrice(item.price)}
                            </p>
                        </div>
                    `).join("")}
                </div>

                <div class="order-footer">
                    <div>
                        <p class="total-label">Order total</p>
                        <h3 class="order-total">
                            ${formatPrice(order.totalAmount)}
                        </h3>
                    </div>
                </div>

                <button
                    type="button"
                    class="view-order-details"
                    data-order-id="${escapeHTML(order._id)}"
                >
                    View Details
                </button>

            </article>
        `;
    });

    ordersContainer.innerHTML = ordersHTML;
}

// ========================================
// FILTER ORDERS
// ========================================

orderFilter.addEventListener("change", () => {
    const selectedStatus = orderFilter.value.toLowerCase();

    if (selectedStatus === "all") {
        displayOrders(allOrders);
        return;
    }

    const filteredOrders = allOrders.filter(order => {
        const status = String(
            order.orderStatus ?? order.status ?? "pending"
        ).toLowerCase();

        return status === selectedStatus;
    });

    displayOrders(filteredOrders);
});

// ========================================
// VIEW ORDER DETAILS
// ========================================

async function viewOrder(orderId) {
    const auth = ensureAuthForOrders();

    if (!auth) return;

    try {
        const response = await fetch(`/orders/order/${encodeURIComponent(orderId)}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${auth.token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to retrieve order details.");
        }

        const order = data.order ?? data;

        displayOrderDetails(order);

    } catch (error) {
        console.error("View order error:", error);
        alert(error.message || "Unable to load order details.");
    }
}

// Handle View Details buttons
ordersContainer.addEventListener("click", event => {
    const button = event.target.closest(".view-order-details");

    if (!button) return;

    const orderId = button.dataset.orderId;

    if (orderId) {
        viewOrder(orderId);
    }
});

// ========================================
// DISPLAY ORDER DETAILS
// ========================================

function displayOrderDetails(order) {
    currentOrderId = order._id;

    const orderIndex = allOrders.findIndex(
        item => item._id === order._id
    );

    orderReference.textContent =
        orderIndex >= 0 ? `Order #${orderIndex + 1}` : `Order #${order._id}`;

    orderDate.textContent = formatDate(order.createdAt);

    orderStatus.textContent =
        order.orderStatus ?? order.status ?? "pending";

    orderPaymentStatus.textContent =
        order.paymentStatus ?? "pending";

    orderShippingAddress.textContent =
        order.shippingAddress ?? "No shipping address provided";

    orderTotal.textContent = formatPrice(order.totalAmount);

    const items = Array.isArray(order.items) ? order.items : [];

    orderDetailsItems.innerHTML = items.map(item => `
        <article class="profile-field" data-field="quantity">

            <div class="field-heading">
                <p class="detail-item-name">
                    ${escapeHTML(item.name)}
                </p>

                <button class="update-btn" type="button">
                    Update
                </button>
            </div>

            <p class="field-value">
                Quantity: ${escapeHTML(item.quantity)}
            </p>

            <form class="edit-form" hidden>
                <input
                    type="number"
                    name="quantity"
                    min="1"
                    step="1"
                    required
                >

                <div class="edit-actions">
                    <button
                        class="save-btn"
                        data-product-id="${escapeHTML(getProductId(item))}"
                        type="submit"
                    >
                        Save Changes
                    </button>

                    <button class="cancel-btn" type="button">
                        Cancel
                    </button>
                </div>
            </form>

        </article>
    `).join("");

    orderDetailsSection.hidden = false;

    requestAnimationFrame(() => {
        orderDetailsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
}

// Close order details
closeOrderDetails.addEventListener("click", () => {
    orderDetailsSection.hidden = true;
});

// ========================================
// HANDLE QUANTITY EDITING
// ========================================

orderDetailsSection.addEventListener("click", event => {

    // Open quantity editing form
    const updateButton = event.target.closest(".update-btn");

    if (updateButton) {
        const field = updateButton.closest(".profile-field");

        if (!field) return;

        const editForm = field.querySelector(".edit-form");
        const fieldValue = field.querySelector(".field-value");
        const input = editForm.querySelector('input[name="quantity"]');

        input.value = fieldValue.textContent
            .replace("Quantity:", "")
            .trim();

        editForm.hidden = false;
        return;
    }

    // Cancel quantity editing
    const cancelButton = event.target.closest(".cancel-btn");

    if (cancelButton) {
        const field = cancelButton.closest(".profile-field");

        if (!field) return;

        const editForm = field.querySelector(".edit-form");

        editForm.reset();
        editForm.hidden = true;
    }
});

// ========================================
// UPDATE ORDER QUANTITY
// ========================================

orderDetailsSection.addEventListener("submit", async event => {
    const form = event.target;

    if (!form.matches(".edit-form")) return;

    event.preventDefault();

    const auth = ensureAuthForOrders();

    if (!auth) return;

    const quantityInput = form.querySelector('input[name="quantity"]');
    const saveButton = form.querySelector(".save-btn");

    const quantity = Number(quantityInput.value);
    const productId = saveButton.dataset.productId;

    if (!Number.isInteger(quantity) || quantity < 1) {
        alert("Please enter a valid quantity.");
        return;
    }

    if (!productId) {
        alert("Product information is missing.");
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const response = await fetch(
            `/orders/updateQuantity/${encodeURIComponent(currentOrderId)}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    quantity,
                    productId
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to update order quantity.");
        }

        await getMyOrders();
        await viewOrder(currentOrderId);

        alert("Quantity updated successfully.");

    } catch (error) {
        console.error("Quantity update error:", error);
        alert(error.message || "Something went wrong.");

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";
    }
});

// ========================================
// CANCEL ORDER
// ========================================

cancelOrderButton.addEventListener("click", async event => {
    event.preventDefault();

    const auth = ensureAuthForOrders();

    if (!auth) return;

    if (!currentOrderId) {
        alert("Please select an order first.");
        return;
    }

    const confirmed = confirm("Are you sure you want to cancel this order?");

    if (!confirmed) return;

    cancelOrderButton.disabled = true;

    try {
        const response = await fetch(
            `/orders/cancelOrder/${encodeURIComponent(currentOrderId)}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to cancel this order.");
        }

        alert("Order has been cancelled.");

        orderDetailsSection.hidden = true;

        await getMyOrders();

    } catch (error) {
        console.error("Cancel order error:", error);
        alert(error.message || "Something went wrong.");

    } finally {
        cancelOrderButton.disabled = false;
    }
});

// ========================================
// UPDATE SHIPPING ADDRESS
// ========================================

shippingEditForm.addEventListener("submit", async event => {
    event.preventDefault();

    const auth = ensureAuthForOrders();

    if (!auth) return;

    const newAddress = shippingAddressInput.value.trim();

    if (!newAddress) {
        alert("Please enter a shipping address.");
        return;
    }

    if (!currentOrderId) {
        alert("Please select an order first.");
        return;
    }

    const saveButton = shippingEditForm.querySelector(".save-btn");

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const response = await fetch(
            `/orders/updateAddress/${encodeURIComponent(currentOrderId)}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    newAddress
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to update shipping address.");
        }

        shippingEditForm.reset();
        shippingEditForm.hidden = true;

        await getMyOrders();
        await viewOrder(currentOrderId);

        alert("Shipping address updated successfully.");

    } catch (error) {
        console.error("Address update error:", error);
        alert(error.message || "Something went wrong.");

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";
    }
});

// ========================================
// INITIALIZE
// ========================================

getMyOrders();
