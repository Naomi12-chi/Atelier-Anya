
// =====================================
// DOM ELEMENTS
// =====================================

const productGrid = document.getElementById("productGrid");

const filterButtons = document.querySelectorAll(".filter-btn");

const productSearch = document.getElementById("searchProducts");

const searchButton = document.getElementById("searchbutton");

const sortSelect = document.getElementById("sortSelect");

const clearSearch = document.getElementById("clearSearch");

const productCount = document.getElementById("product-count");

const resetFilters = document.getElementById("resetFilters");

// QUICK VIEW ELEMENTS

const quickViewModal = document.getElementById("quickViewModal");

const quickViewClose = document.getElementById("quickViewClose");

const quickViewImage = document.getElementById("quickViewImage");

const quickViewName = document.getElementById("quickViewName");

const quickViewCategory = document.getElementById("quickViewCategory");

const quickViewType = document.getElementById("quickViewType");

const quickViewRating = document.getElementById("quickViewRating");

const quickViewPrice = document.getElementById("quickViewPrice");

const quickViewDescription = document.getElementById("quickViewDescription");

const quickViewQuantity = document.getElementById("quickViewQuantity");

const quickViewMinus = document.getElementById("quickViewMinus");

const quickViewPlus = document.getElementById("quickViewPlus");

const quickViewAddCart = document.getElementById("quickViewAddCart");


// =====================================
// GLOBAL VARIABLES
// =====================================

let quickViewProduct = null;

let quickViewQuantityValue = 1;

let selectedCategory = "All";

let searchTerm = "";

let selectedSort = "default";

// This array will hold products fetched from MongoDB.
let products = [];


// =====================================
// GET PRODUCTS FROM DATABASE
// =====================================

async function getProducts() {
    try {
        const response = await fetch("products/allProducts");

        if (!response.ok) {
            throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        // Assign fetched products to the global array.
        products = data;

        console.log("Products fetched:", products);

        // Display products after fetching.
        updateProducts();

    } catch (error) {
        console.error("Error fetching products:", error);

        productGrid.innerHTML = `
            <div class="no-results">
                <h3>Unable to Load Products</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
}


// =====================================
// DISPLAY PRODUCT
// =====================================

function displayProduct(product) {

    const productCard = document.createElement("div");

    productCard.classList.add("product-card");

    // PRODUCT IMAGE

    const productImage = document.createElement("img");

    productImage.src = product.image;

    productImage.alt = product.name;

    // PRODUCT INFORMATION

    const productInfo = document.createElement("div");

    productInfo.classList.add("product-info");

    const productName = document.createElement("h3");

    productName.textContent = product.name;

    const productCategory = document.createElement("span");

    productCategory.textContent = `Category: ${product.category}`;

    const productPrice = document.createElement("span");

    productPrice.classList.add("product-price");

    productPrice.textContent = `Price: ₦${Number(product.price).toLocaleString()}`;


    // PRODUCT RATING

    const productRating = document.createElement("span");

    productRating.classList.add("rating");

    for (let i = 1; i <= 5; i++) {

        const star = document.createElement("i");

        if (i <= (product.rating || 0)) {

            star.classList.add("fa-solid", "fa-star");

        } else {

            star.classList.add("fa-regular", "fa-star");

        }

        productRating.appendChild(star);
    }


    // APPEND PRODUCT INFORMATION

    productInfo.appendChild(productName);

    productInfo.appendChild(productCategory);

    productInfo.appendChild(productPrice);

    productInfo.appendChild(productRating);

    productCard.appendChild(productImage);

    productCard.appendChild(productInfo);


    // =====================================
    // ADD TO CART BUTTON
    // =====================================

    const addButton = document.createElement("button");

    addButton.classList.add("product-action");

    addButton.textContent = "Add to Cart";

    addButton.addEventListener("click", (event) => {

        event.stopPropagation();

        if (!product._id) {
            console.error("Product ID is missing:", product);
            return;
        }

        // Find product using its MongoDB ID.
        const existingProduct = cart.find(
            (item) => item.productId === product._id
        );

        if (existingProduct) {

            existingProduct.quantity++;

        } else {

            cart.push({

                productId: product._id,

                name: product.name,

                price: product.price,

                quantity: 1

            });

        }

        // Save updated cart.

        localStorage.setItem("cart", JSON.stringify(cart));

        updateCartCount();

        displayCart();

    });

    productCard.appendChild(addButton);


    // =====================================
    // QUICK VIEW
    // =====================================

    productCard.addEventListener("click", () => {

        openQuickViewProduct(product);

    });

    productGrid.appendChild(productCard);

}


// =====================================
// OPEN QUICK VIEW
// =====================================

function openQuickViewProduct(product) {

    quickViewProduct = product;

    quickViewQuantityValue = 1;

    quickViewQuantity.textContent = quickViewQuantityValue;

    quickViewImage.src = product.image;

    quickViewImage.alt = product.name;

    quickViewName.textContent = product.name;

    quickViewCategory.textContent = `Category: ${product.category}`;

    quickViewType.textContent = `Type: ${product.type || ""}`;

    quickViewPrice.textContent = `₦${Number(product.price).toLocaleString()}`;

    quickViewDescription.textContent =
        `Experience the luxurious quality of ${product.name}, carefully selected for the Atelier Anya collection.`;


    // QUICK VIEW RATING

    quickViewRating.innerHTML = "";

    for (let i = 1; i <= 5; i++) {

        const star = document.createElement("i");

        if (i <= (product.rating || 0)) {

            star.classList.add("fa-solid", "fa-star");

        } else {

            star.classList.add("fa-regular", "fa-star");

        }

        quickViewRating.appendChild(star);

    }

    quickViewModal.classList.add("active");

}


// =====================================
// CLOSE QUICK VIEW
// =====================================

if (quickViewClose) {

    quickViewClose.addEventListener("click", () => {

        quickViewModal.classList.remove("active");

    });

}


if (quickViewModal) {

    quickViewModal.addEventListener("click", (event) => {

        if (event.target === quickViewModal) {

            quickViewModal.classList.remove("active");

        }

    });

}


// =====================================
// QUICK VIEW PLUS BUTTON
// =====================================

if (quickViewPlus) {

    quickViewPlus.addEventListener("click", () => {

        quickViewQuantityValue++;

        quickViewQuantity.textContent = quickViewQuantityValue;

    });

}


// =====================================
// QUICK VIEW MINUS BUTTON
// =====================================

if (quickViewMinus) {

    quickViewMinus.addEventListener("click", () => {

        if (quickViewQuantityValue > 1) {

            quickViewQuantityValue--;

            quickViewQuantity.textContent = quickViewQuantityValue;

        }

    });

}


// =====================================
// QUICK VIEW ADD TO CART
// =====================================

if (quickViewAddCart) {

    quickViewAddCart.addEventListener("click", () => {

        if (!quickViewProduct) return;

        if (!quickViewProduct._id) {
            console.error("Product ID is missing:", quickViewProduct);
            return;
        }

        const existingProduct = cart.find(
            (item) => item.productId === quickViewProduct._id
        );

        if (existingProduct) {

            existingProduct.quantity += quickViewQuantityValue;

        } else {

            cart.push({

                productId: quickViewProduct._id,

                name: quickViewProduct.name,

                price: quickViewProduct.price,

                quantity: quickViewQuantityValue

            });

        }

        localStorage.setItem("cart", JSON.stringify(cart));

        updateCartCount();

        displayCart();

        quickViewModal.classList.remove("active");

    });

}


// =====================================
// UPDATE PRODUCTS
// =====================================

function updateProducts() {

    let updatedProducts = [...products];


    // CATEGORY FILTER

    if (selectedCategory !== "All") {

        updatedProducts = updatedProducts.filter((product) => {

            return product.category === selectedCategory;

        });

    }


    // SEARCH FILTER

    if (searchTerm !== "") {

        updatedProducts = updatedProducts.filter((product) => {

            return (

                product.name.toLowerCase().includes(searchTerm) ||

                (product.category || "").toLowerCase().includes(searchTerm) ||

                (product.type || "").toLowerCase().includes(searchTerm)

            );

        });

    }


    // SORT PRODUCTS

    if (selectedSort === "price-low") {

        updatedProducts.sort((a, b) => a.price - b.price);

    } else if (selectedSort === "price-high") {

        updatedProducts.sort((a, b) => b.price - a.price);

    } else if (selectedSort === "name") {

        updatedProducts.sort((a, b) => a.name.localeCompare(b.name));

    }


    // CLEAR PRODUCT GRID

    productGrid.innerHTML = "";


    // CHECK FOR EMPTY RESULTS

    if (updatedProducts.length === 0) {

        productGrid.innerHTML = `
            <div class="no-results">
                <h3>No Products Found</h3>
                <p>Try changing your search or filter.</p>
            </div>
        `;

    } else {

        updatedProducts.forEach((product) => {

            displayProduct(product);

        });

    }


    // UPDATE PRODUCT COUNT

    if (productCount) {

        productCount.textContent = `${updatedProducts.length} products`;

    }

}


// =====================================
// CATEGORY FILTER BUTTONS
// =====================================

filterButtons.forEach((button) => {

    button.addEventListener("click", () => {

        filterButtons.forEach((btn) => {

            btn.classList.remove("active");

        });

        button.classList.add("active");

        selectedCategory = button.textContent.trim();

        updateProducts();

    });

});


// =====================================
// SEARCH PRODUCTS
// =====================================

if (productSearch) {

    productSearch.addEventListener("input", () => {

        searchTerm = productSearch.value.trim().toLowerCase();

        updateProducts();

    });

}


// SEARCH BUTTON

if (searchButton) {

    searchButton.addEventListener("click", () => {

        if (productSearch) {

            searchTerm = productSearch.value.trim().toLowerCase();

            updateProducts();

        }

    });

}


// =====================================
// CLEAR SEARCH
// =====================================

if (clearSearch) {

    clearSearch.addEventListener("click", () => {

        if (productSearch) {

            productSearch.value = "";

        }

        searchTerm = "";

        updateProducts();

    });

}


// =====================================
// SORT PRODUCTS
// =====================================

if (sortSelect) {

    sortSelect.addEventListener("change", () => {

        selectedSort = sortSelect.value;

        updateProducts();

    });

}


// =====================================
// RESET FILTERS
// =====================================

if (resetFilters) {

    resetFilters.addEventListener("click", () => {

        selectedCategory = "All";

        searchTerm = "";

        selectedSort = "default";

        if (productSearch) {

            productSearch.value = "";

        }

        if (sortSelect) {

            sortSelect.value = "default";

        }

        filterButtons.forEach((button) => {

            button.classList.remove("active");

            if (button.textContent.trim() === "All") {

                button.classList.add("active");

            }

        });

        updateProducts();

    });

}


// =====================================
// INITIAL DISPLAY
// =====================================

// Fetch products first.
// updateProducts() will run after the fetch succeeds.

getProducts();
