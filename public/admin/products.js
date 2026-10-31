const logoutButton = document.getElementById("logoutButton");
const totalProducts = document.getElementById("totalProducts");
const addProductButton = document.getElementById("addProductButton");
const productForm = document.getElementById("productForm");
const productModal = document.getElementById("productModal")
const saveProduct = document.getElementById("saveProductButton");
const searchDisplay = document.getElementById("searchDisplay");
const searchButton = document.getElementById("searchButton");

const inStockProducts = document.getElementById("inStockProducts");
const lowStockProducts = document.getElementById("lowStockProducts");
const outOfStockProducts = document.getElementById("outOfStockProducts");

const productsTableBody = document.getElementById("productsTableBody")

document.getElementById("categoryFilter").addEventListener("change", filterProducts)
document.getElementById("stockFilter").addEventListener("change", filterProducts)

let products = [];

async function adminCheck() {
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
  localStorage.removeItem("token");
  localStorage.removeItem("Id");
  localStorage.removeItem("role");

  window.location.href = "../login.html";
});

//view total products

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

addProductButton.addEventListener("click", function () {
  
  productModal.hidden = !productModal.hidden;

  console.log("ran")
});

//create product
productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const token = localStorage.getItem("token");
  const formData = new FormData(productForm);
  if (!token) return (window.location.href = "..login.html");
  // const productName = document.getElementById("productName").value
  // const productPrice = document.getElementById("productPrice").value
  // const productStock = document.getElementById("productStock").value
  // const productCategory = document.getElementById("productCategory").value
  try {
    const response = await fetch("/products", {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
      },
      body: formData,
    });
    if (response.status === 401 || response.status === 403)
      return (window.location.href = "../login.html");

    const data = await response;
    alert("Product added successfully")
    console.log(data);
  } catch (error) {
    console.error(error);
  }
});

// get one product
searchButton.addEventListener("click", async (event) => {
  event.preventDefault();
  console.log("ran");
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "../login.html");
  const name = document.getElementById("productSearch").value;
  console.log(name);

  try {
    const response = await fetch(`/products/getProduct/${name}`, {
      method: "GET",
    });

    const result = await response.json();
    searchDisplay.innerHTML = `
 <h2>Name: ${result.name}</h2>
 <h3>Category: ${result.category}</h3>
 <p>Price: ${result.price}</p>
 <p>Aviailable Stock: ${result.stock}</p>
 `;
    name.textContent = "";
  } catch (error) {
    console.error(error);
  }
});
async function getStockUnits() {
  console.log("ran");
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "../login.html");
  let lowStock = 0;
  let availableStock = 0;
  let unavailableStock = 0;
  try {
    const response = await fetch("/products/allProducts", {
      method: "GET",
    });
    const products = await response.json();
    console.log(products)
    products.forEach((product) => {
      console.log(product.stock)
      if (product.stock === 0) {
        unavailableStock++;
        outOfStockProducts.textContent = unavailableStock
      } else if (product.stock <= 5) {
        lowStock++;
        lowStockProducts.textContent = lowStock
      } else {
        availableStock++;
        inStockProducts.textContent = availableStock
      }
    });
  } catch (error) {
    console.error(error);
  }
}


async function getAllProducts() {
    const token = localStorage.getItem("token");
    if (!token) return window.location.href = "../login.html";

    try {
        const response = await fetch("/products/allProducts", {
            method: "GET",
            headers: {
                Authorization: `bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Failed to fetch products");

        products = await response.json();

        filterProducts();

    } catch (error) {
        console.error(error);
    }
}

// Filter products by category and stock levels
function filterProducts() {
    const categoryFilter = document.getElementById("categoryFilter").value;
    const stockFilter = document.getElementById("stockFilter").value;

    const result = products.filter(product => {
        const matchesCategory =
            categoryFilter === "all" ||
            product.category === categoryFilter;

        const stock = Number(product.stock);

        const matchesStock =
            stockFilter === "all" ||
            (stockFilter === "In Stock" && stock > 5) ||
            (stockFilter === "Low Stock" && stock > 0 && stock <= 5) ||
            (stockFilter === "Out of Stock" && stock === 0);

        return matchesCategory && matchesStock;
    });

    productsTableBody.innerHTML = "";

    result.forEach(product => {
        const row = document.createElement("tr");

        const productNameCell = document.createElement("td");
        productNameCell.textContent = product.name;

        const categoryCell = document.createElement("td");
        categoryCell.textContent = product.category;

        const priceCell = document.createElement("td");
        priceCell.textContent = product.price;

        const stockCell = document.createElement("td");
        stockCell.textContent = product.stock;

        row.appendChild(productNameCell);
        row.appendChild(categoryCell);
        row.appendChild(priceCell);
        row.appendChild(stockCell);

        productsTableBody.appendChild(row);
    });
}

getAllProducts();

allProducts();
getStockUnits();
getAllProducts()
