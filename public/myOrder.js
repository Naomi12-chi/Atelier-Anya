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
console.log(cancelOrderButton);

let allOrders = [];

const formatPrice = (amount) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
};

// Escape database values before inserting them into HTML
function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
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
    year: "numeric",
  });
}

async function getMyOrders() {
  const Id = localStorage.getItem("Id");
  const token = localStorage.getItem("token");

  // Check whether the customer is logged in
  if (!Id || !token) {
    window.location.href = "login.html";
    return;
  }

  loadingMessage.hidden = false;
  errorMessage.hidden = true;
  emptyOrders.hidden = true;
  ordersContainer.innerHTML = "";

  try {
    const response = await fetch(`/orders/myOrders/${Id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to retrieve your orders.");
    }

    // Support either an array or an object containing an orders array
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
    errorMessage.textContent =
      error.message || "Something went wrong. Please try again.";

    errorMessage.hidden = false;
  } finally {
    loadingMessage.hidden = true;
  }
}

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
      order.orderStatus ?? order.status ?? "pending",
    ).toLowerCase();

    const items = Array.isArray(order.items) ? order.items : [];

    const orderDate = formatDate(order.createdAt);

    ordersHTML += `
            <article class="order-card">

                <div class="order-header">
                    <div>
                        <p class="order-label">ORDER ${index + 1}</p>
                        <p class="order-date">${orderDate}</p>
                    </div>

                    <span class="order-status status-${escapeHTML(status)}">
                        ${escapeHTML(status)}
                    </span>
                </div>

                <div class="order-items">
                    ${items
                      .map(
                        (item) => `
                        <div class="order-item">
                            <div class="item-details">
                                <h3>${escapeHTML(item.name)}</h3>
                                <p>Quantity: ${escapeHTML(item.quantity)}</p>
                            </div>

                            <p class="item-price">
                                ${formatPrice(Number(item.price) || 0)}
                            </p>
                        </div>
                    `,
                      )
                      .join("")}
                    

                </div>

                <div class="order-footer">
                    <div>
                        <p class="total-label">Order total</p>
                        <h3 class="order-total">
                            ${formatPrice(Number(order.totalAmount) || 0)}
                        </h3>
                    </div>
                    
                   
                </div>
                <button type="button" class="view-order-details" data-order-id="${order._id}">View Details</button>

                
            </article>
            
        `;
  });

  ordersContainer.innerHTML = ordersHTML;
}

// cance order
cancelOrderButton.addEventListener("click", async (event) => {
  event.preventDefault();
  const token = localStorage.getItem("token");
  const response = await fetch(`/orders/cancelOrder/${currentOrderId}`, {
    method: "PATCH",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await response.json()
  if (response.ok) return alert("Order has been cancelled");
  await getMyOrders();
  orderStatus.textContent = data.status;
// //   displayOrderDetails(currentOrderId)
});
// Filter orders by status
orderFilter.addEventListener("change", () => {
  const selectedStatus = orderFilter.value.toLowerCase();

  if (selectedStatus === "all") {
    displayOrders(allOrders);
    return;
  }

  const filteredOrders = allOrders.filter((order) => {
    const status = String(
      order.orderStatus ?? order.status ?? "pending",
    ).toLowerCase();

    return status === selectedStatus;
  });

  displayOrders(filteredOrders);
});

// Load the customer's orders

async function viewOrder(orderId) {
  console.log("ran");
  const token = localStorage.getItem("token");
  const response = await fetch(`/orders/order/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: `bearer ${token}`,
    },
  });
  const order = await response.json();
  displayOrderDetails(order);
  console.log(order);
}
ordersContainer.addEventListener("click", (event) => {
  if (event.target.classList.contains("view-order-details")) {
    const orderId = event.target.dataset.orderId;
    viewOrder(orderId);
  }
});
function displayOrderDetails(order) {
  currentOrderId = order._id;

  const orderIndex = allOrders.findIndex((item) => item._id === order._id);

  orderReference.textContent = `Order #${orderIndex + 1}`;
  orderDate.textContent = new Date(order.createdAt).toLocaleDateString();
  orderStatus.textContent = order.status;
  orderPaymentStatus.textContent = order.paymentStatus;
  orderShippingAddress.textContent = order.shippingAddress;
  orderTotal.textContent = `₦${Number(order.totalAmount).toLocaleString()}`;

  orderDetailsItems.innerHTML = order.items
    .map(
      (item) => `
       
<article class="profile-field" data-field="quantity">

    <div class="field-heading">
        <p class="detail-item-name">${item.name}</p>

        <button class="update-btn" type="button">
            Update
        </button>
        
    </div>

    <p class="field-value" id="orderQuantity">Quantity: ${item.quantity}</p>

    <form class="edit-form" id="quantityForm" hidden>
        <input
        id="quantityInput"
            type="number"
            name="quantity"
            min="1"
            step="1"
            required
        >

        <div class="edit-actions">
            <button class="save-btn" data-product-id="${item.productId}" type="submit">
                Save Changes
            </button>

            <button class="cancel-btn" type="button">
                Cancel
            </button>
        </div>
    </form>

</article>

    `,
    )
    .join("");

  orderDetailsSection.hidden = false;
  requestAnimationFrame(() => {
    orderDetailsSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

closeOrderDetails.addEventListener("click", () => {
  orderDetailsSection.hidden = true;
});

// Handle Update buttons and Cancel buttons in the order details section
orderDetailsSection.addEventListener("click", (event) => {
  const button = event.target.closest(".update-btn");
  if (!button) return;
  console.log(button);
  const productId = button.dataset.productId;
  console.log(productId);

  // Open the appropriate edit form
  if (event.target.closest(".update-btn")) {
    const field = event.target.closest(".profile-field");

    if (!field) return;

    const editForm = field.querySelector(".edit-form");
    const fieldValue = field.querySelector(".field-value");

    if (!editForm || !fieldValue) return;

    // Fill the input with the current value before editing
    const input = editForm.querySelector("input, textarea");

    if (input) {
      if (field.dataset.field === "shippingAddress") {
        input.value = orderShippingAddress.textContent;
      } else if (field.dataset.field === "quantity") {
        const quantityText = fieldValue.textContent;
        input.value = quantityText.replace("Quantity:", "").trim();
      }
    }

    editForm.hidden = false;
    return;
  }

  // Cancel editing and hide the form
  if (event.target.closest(".cancel-btn")) {
    const field = event.target.closest(".profile-field");

    if (!field) return;

    const editForm = field.querySelector(".edit-form");

    if (editForm) {
      editForm.reset();
      editForm.hidden = true;
    }
  }
});

shippingEditForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const newAddress = shippingAddressInput.value.trim();
  console.log(newAddress);
  const token = localStorage.getItem("token");

  if (!newAddress) {
    alert("Please enter a shipping address.");
    return;
  }

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const saveButton = shippingEditForm.querySelector(".save-btn");
  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  try {
    const response = await fetch(`/orders/updateAddress/${currentOrderId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        newAddress,
      }),
    });
    console.log(response);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update shipping address.");
    }

    // Update the visible address.
    orderShippingAddress.textContent = newAddress;

    // Close and reset the edit form.
    shippingEditForm.reset();
    shippingEditForm.hidden = true;

    await getMyOrders();

    alert("Shipping address updated successfully.");
  } catch (error) {
    console.error("Address update error:", error);
    alert(error.message || "Something went wrong.");
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save Changes";
  }
});

orderDetailsSection.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;

  if (!form.matches('.profile-field[data-field="quantity"] .edit-form')) {
    return;
  }

  const quantityInput = form.querySelector('input[name="quantity"]');
  const quantity = Number(quantityInput.value);
  const saveButton = form.querySelector(".save-btn");
  const productId = saveButton.dataset.productId;
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  saveButton.disabled = true;
  saveButton.textContent = "Saving...";
  try {
    const response = await fetch(`orders/updateQuantity/${currentOrderId}`, {
      method: "PATCH",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quantity,
        productId,
      }),
    });
    const data = await response.json();
    console.log(data);
    orderTotal.textContent = `₦${data.totalAmount.toLocaleString()}`;

    if (!response.ok) {
      throw new Error(data.message || "Failed to update order quantity.");
    }
    // Update the visible quantity.
    orderQuantity.textContent = quantity;

    // Close and reset the edit form
    form.reset();
    form.hidden = true;

    await getMyOrders();

    alert("Quantity updated successfully.");
  } catch (error) {
    console.error("Quantity update error:", error);
    alert(error.message || "Something went wrong.");
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save Changes";
  }
});

getMyOrders();
