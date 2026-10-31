
const checkoutItem = JSON.parse(localStorage.getItem("checkoutItem"));

const checkoutForm = document.getElementById("checkoutForm");
const placeOrderButton = document.getElementById("placeOrderButton");

const checkoutItems = document.getElementById("checkoutItems");
const checkoutItemCount = document.getElementById("checkoutItemCount");
const checkoutSubtotal = document.getElementById("checkoutSubtotal");
const checkoutShipping = document.getElementById("checkoutShipping");
const checkoutTotal = document.getElementById("checkoutTotal");

let selectedProduct = null;


// LOAD SELECTED PRODUCT
async function loadCheckoutItem() {

    if (!checkoutItem || !checkoutItem.productId || !checkoutItem.quantity) {
        alert("No product selected for checkout.");
        window.location.href = "./cart.html";
        return;
    }

    try {

        const response = await fetch("products/allProducts");

        if (!response.ok) {
            throw new Error("Unable to retrieve products.");
        }

        const products = await response.json();

        selectedProduct = products.find(
            (product) => product._id === checkoutItem.productId
        );

        if (!selectedProduct) {
            alert("This product could not be found.");
            window.location.href = "./cart.html";
            return;
        }

        displayCheckoutItem();

    } catch (error) {

        console.error("Checkout loading error:", error);
        alert("Unable to load your checkout details.");

    }
}


// DISPLAY SELECTED PRODUCT
function displayCheckoutItem() {

    const subtotal = selectedProduct.price * checkoutItem.quantity;

    checkoutItems.innerHTML = "";

    const productContainer = document.createElement("div");
    productContainer.classList.add("checkout-product");

    const productName = document.createElement("h3");
    productName.textContent = selectedProduct.name;

    const productQuantity = document.createElement("p");
    productQuantity.textContent = `Quantity: ${checkoutItem.quantity}`;

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

    checkoutItemCount.textContent = `${checkoutItem.quantity} item(s)`;

    checkoutSubtotal.textContent = `₦${subtotal.toLocaleString()}`;

    checkoutShipping.textContent = "To be confirmed";

    checkoutTotal.textContent = "To be confirmed";
}


// CREATE ORDER
checkoutForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
        alert("Please log in before placing your order.");
        window.location.href = "./login.html";
        return;
    }

    if (!selectedProduct) {
        alert("Product details are not available.");
        return;
    }

    const shippingAddress = `
        ${document.getElementById("shippingAddress").value.trim()},
        ${document.getElementById("city").value.trim()},
        ${document.getElementById("state").value.trim()}
    `.trim();

    const orderData = {
        items: [
            {
                productId: checkoutItem.productId,
                name: selectedProduct.name,
                quantity: checkoutItem.quantity
            }
        ],
        shippingAddress: shippingAddress
    };

    try {

        placeOrderButton.disabled = true;
        placeOrderButton.textContent = "Processing...";

        const response = await fetch("orders/createOrder", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });
if(response.status === 401 || response.status === 403) return window.location.href = "./login.html"
        const data = await response.json();
        

        if (!response.ok) {
            throw new Error(data);
        }

        alert(data);

        localStorage.removeItem("checkoutItem");

        window.location.href = "./myOrder.html";

    } catch (error) {

        console.error("Order creation error:", error);
        alert(error.message || "Something went wrong while creating your order.");

    } finally {

        placeOrderButton.disabled = false;
        placeOrderButton.innerHTML =
            'Place Order <i class="fa-solid fa-arrow-right"></i>';

    }

});


// INITIALIZE CHECKOUT
loadCheckoutItem();
