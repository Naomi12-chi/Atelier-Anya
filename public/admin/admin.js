// Use centralized auth for admin
async function ensureAdminAuth() {
    if (window.Auth) {
        const ok = await window.Auth.requireAuth({ requireAdmin: true });
        return ok;
    }
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "../login.html";
        return false;
    }
    try {
        const response = await fetch('/user/adminCheck', {
            method: "GET",
            headers: {
                Authorization: `bearer ${token}` ,
                "Content-Type": "application/json",
            },
        });
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("Id");
            localStorage.removeItem("role");
            window.location.replace("../login.html");
            return false;
        }
        if (!response.ok) {
            window.location.href = "../login.html";
            return false;
        }
        return true;
    } catch (error) {
        window.location.href = "../login.html";
        return false;
    }
}

const logoutButton = document.getElementById("logoutButton");
const totalOrders = document.getElementById("totalOrders");
const totalProducts = document.getElementById("totalProducts");
const totalCustomers = document.getElementById("totalCustomers");
const recentOrderBody = document.getElementById("recentOrderBody")

//admin checkpoint before page loads
async function adminCheck() {
  console.log("ran");
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../login.html";
  }
  try {
    const response = await fetch(`/user/adminCheck`, {
      method: "GET",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("Id");
      localStorage.removeItem("role");

      window.location.replace("../login.html");
      return;
    }
    if (!response.ok) {
      window.location.href = "../login.html";
      return false;
    }
    if (response.ok) return true;
  } catch (error) {
    window.location.href = "../login.html";
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  adminCheck();
});

//log out
logoutButton.addEventListener("click", () => {
  if (window.Auth) {
    window.Auth.clearAuthData();
  } else {
    localStorage.removeItem("token");
    localStorage.removeItem("Id");
    localStorage.removeItem("role");
  }
  window.location.href = "../login.html";
});

// get orders
async function allOrders() {
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "../login.html");

  try {
    const response = await fetch("/orders/allOrders", {
      method: "GET",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401 || response.status === 403)
      return (window.location.replace = "../login.html");
    const data = await response.json();
    const ordersNumber = data.length;
    totalOrders.textContent = ordersNumber;
  } catch (error) {
    return window.location.href("../login.html");
  }
}

//all products
async function allProducts() {
  const token = localStorage.getItem("token");
  if (!token) return window.location.href("../login.html");

  try {
    const response = await fetch("/products/viewProducts", {
      method: "GET",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 403 || response.status === 401)
      return windows.location.href("../login.html");

    const totalNumbers = await response.json();
    totalProducts.textContent = totalNumbers.length;
  } catch (error) {
    window.location.href = "../login.html";
  }
}

// all customers, total numbers of registered users
async function allCustomers() {
  const token = localStorage.getItem("token");
  if (!token) return window.location.href("../login.html");

  try {
    const response = await fetch("/user/users", {
      method: "GET",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 403 || response.status === 401)
      return window.location.href("../login.html");
    const data = await response.json();
    const totalNumbers = data.users.length;
    totalCustomers.textContent = totalNumbers;
  } catch (error) {
    window.location.href = "../login.html";
  }
}

// Get recent orders
async function getRecentOrders() {
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "../login.html");
  try {
    const response = await fetch ("/orders/allOrders", {
        method: "GET",
        headers: {
            Authorization: `bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
    const orders = await response.json();
    orders.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
    })
    const recentOrders = orders.slice(0, 5)
    console.log(recentOrders)
    recentOrders.forEach((order) => {
      const row = document.createElement("tr")
      const referenceCell = document.createElement("td")
      referenceCell.textContent = order._id
      const customerCell = document.createElement("td");
      customerCell.textContent = order.userId;
      const totalCell = document.createElement("td");
      totalCell.textContent = order.totalAmount;
      const paymentCell = document.createElement("td");
      paymentCell.textContent = order.paymentStatus;
      const orderStatusCell = document.createElement("td");
      orderStatusCell.textContent = order.status;
      const addressCell = document.createElement("td");
      addressCell.textContent = order.shippingAddress

      row.appendChild(referenceCell);
      row.appendChild(customerCell);
      row.appendChild(totalCell);
      row.appendChild(paymentCell)
      row.appendChild(orderStatusCell);
      row.appendChild(addressCell);

      recentOrderBody.appendChild(row)
      

      
    });

   

  } catch(error) {
    console.log(error)
  }
}

allOrders();
allProducts();
allCustomers();
getRecentOrders();



