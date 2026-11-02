/* =========================================================
   ATELIER ANYA - SHOP PAGE
   Requires cart.js to load before this file.
   ========================================================= */

"use strict";

// DOM ELEMENTS
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

// GLOBAL VARIABLES
let quickViewProduct = null;
let quickViewQuantityValue = 1;
let selectedCategory = "All";
let searchTerm = "";
let selectedSort = "default";
let products = [];

function getCartManager() {
    if (
        !window.AtelierCart ||
        typeof window.AtelierCart.addItem !== "function"
    ) {
        console.error(
            "AtelierCart is unavailable. Make sure cart.js is loaded before shop.js."
        );

        alert(
            "The cart is temporarily unavailable. Please refresh the page and try again."
        );

        return null;
    }

    return window.AtelierCart;
}

function addProductToCart(product, quantity = 1) {
    if (!product || !product._id) {
        console.error("Product ID is missing:", product);

        alert(
            "This product could not be added. Please refresh the page and try again."
        );

        return;
    }

    const cartManager = getCartManager();

    if (!cartManager) return;

    const result = cartManager.addItem({
        productId: String(product._id),
        name: product.name,
        price: product.price
    }, quantity);

    if (result.success) {
        console.log(`${product.name} added to cart.`);
    }
}

// RESUME ADD TO CART AFTER LOGIN
async function resumePendingAddToCart() {
    try {
        const token =
            window.Auth &&
            typeof window.Auth.getToken === "function"
                ? window.Auth.getToken()
                : localStorage.getItem("token");

        const authUserId =
            window.Auth &&
            typeof window.Auth.getUserId === "function"
                ? window.Auth.getUserId()
                : null;

        const userId = authUserId || localStorage.getItem("Id");

        if (!token || !userId) return;

        let pendingProduct = null;

        const savedPendingProduct =
            localStorage.getItem("atelierAnyaPendingCartItem");

        if (savedPendingProduct) {
            try {
                pendingProduct = JSON.parse(savedPendingProduct);
            } catch (parseError) {
                console.error(
                    "The pending cart item could not be read:",
                    parseError
                );

                localStorage.removeItem(
                    "atelierAnyaPendingCartItem"
                );
            }
        }

        // Also check the centralized Auth pending action.
        if (
            !pendingProduct &&
            window.Auth &&
            typeof window.Auth.getPendingAction === "function"
        ) {
            const pendingAction =
                window.Auth.getPendingAction();

            if (
                pendingAction &&
                pendingAction.type === "ADD_TO_CART" &&
                pendingAction.payload
            ) {
                pendingProduct = pendingAction.payload;
            }
        }

        if (!pendingProduct || !pendingProduct.productId) {
            return;
        }

        const cartManager = getCartManager();

        if (!cartManager) return;

        const result = cartManager.addItem({
            productId: String(pendingProduct.productId),
            name:
                pendingProduct.productName ||
                pendingProduct.name ||
                "Product",
            price: Number(pendingProduct.price) || 0
        }, Number(pendingProduct.quantity) || 1);

        if (result.success) {
            localStorage.removeItem(
                "atelierAnyaPendingCartItem"
            );

            if (
                window.Auth &&
                typeof window.Auth.clearPendingAction === "function"
            ) {
                const pendingAction =
                    window.Auth.getPendingAction();

                if (
                    pendingAction &&
                    pendingAction.type === "ADD_TO_CART"
                ) {
                    window.Auth.clearPendingAction();
                }
            }

            alert("Product added to your cart successfully.");
        }

    } catch (error) {
        console.error(
            "Could not resume the pending add-to-cart action:",
            error
        );
    }
}

// GET PRODUCTS FROM DATABASE
async function getProducts() {
    if (!productGrid) return;

    try {
        const response = await fetch("products/allProducts");

        if (!response.ok) {
            throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                "The products response was not an array"
            );
        }

        products = data;

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

// DISPLAY PRODUCT
function displayProduct(product) {
    const productCard = document.createElement("div");
    productCard.classList.add("product-card");

    // PRODUCT IMAGE
    const productImage = document.createElement("img");

    productImage.src =
        product.productImage ||
        product.image ||
        product.imageUrl ||
        "images/placeholder.jpg";

    productImage.alt =
        product.name || "Atelier Anya product";

    productImage.onerror = function () {
        this.onerror = null;
        this.src = "images/placeholder.jpg";
    };

    // PRODUCT INFORMATION
    const productInfo = document.createElement("div");
    productInfo.classList.add("product-info");

    const productName = document.createElement("h3");
    productName.textContent =
        product.name || "Unnamed product";

    const productCategory = document.createElement("span");
    productCategory.textContent =
        `Category: ${product.category || "Uncategorized"}`;

    const productPrice = document.createElement("span");
    productPrice.classList.add("product-price");

    productPrice.textContent =
        `Price: ₦${Number(product.price || 0).toLocaleString()}`;

    // PRODUCT RATING
    const productRating = document.createElement("span");
    productRating.classList.add("rating");

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("i");

        star.classList.add(
            i <= (Number(product.rating) || 0)
                ? "fa-solid"
                : "fa-regular",
            "fa-star"
        );

        productRating.appendChild(star);
    }

    productInfo.append(
        productName,
        productCategory,
        productPrice,
        productRating
    );

    productCard.append(
        productImage,
        productInfo
    );

    // ADD TO CART BUTTON
    const addButton = document.createElement("button");

    addButton.classList.add("product-action");
    addButton.type = "button";
    addButton.textContent = "Add to Cart";

    addButton.addEventListener("click", event => {
        event.stopPropagation();

        addProductToCart(product, 1);
    });

    productCard.appendChild(addButton);

    // QUICK VIEW
    productCard.addEventListener("click", () => {
        openQuickViewProduct(product);
    });

    productGrid.appendChild(productCard);
}

// OPEN QUICK VIEW
function openQuickViewProduct(product) {
    if (!quickViewModal) return;

    quickViewProduct = product;
    quickViewQuantityValue = 1;

    if (quickViewQuantity) {
        quickViewQuantity.textContent =
            String(quickViewQuantityValue);
    }

    if (quickViewImage) {
        quickViewImage.src =
            product.productImage ||
            product.image ||
            product.imageUrl ||
            "images/placeholder.jpg";

        quickViewImage.alt =
            product.name || "Atelier Anya product";

        quickViewImage.onerror = function () {
            this.onerror = null;
            this.src = "images/placeholder.jpg";
        };
    }

    if (quickViewName) {
        quickViewName.textContent = product.name || "";
    }

    if (quickViewCategory) {
        quickViewCategory.textContent =
            `Category: ${product.category || "Uncategorized"}`;
    }

    if (quickViewType) {
        quickViewType.textContent =
            `Type: ${product.type || ""}`;
    }

    if (quickViewPrice) {
        quickViewPrice.textContent =
            `₦${Number(product.price || 0).toLocaleString()}`;
    }

    if (quickViewDescription) {
        quickViewDescription.textContent =
            `Experience the luxurious quality of ${product.name || "this product"}, carefully selected for the Atelier Anya collection.`;
    }

    // QUICK VIEW RATING
    if (quickViewRating) {
        quickViewRating.textContent = "";

        for (let i = 1; i <= 5; i++) {
            const star = document.createElement("i");

            star.classList.add(
                i <= (Number(product.rating) || 0)
                    ? "fa-solid"
                    : "fa-regular",
                "fa-star"
            );

            quickViewRating.appendChild(star);
        }
    }

    quickViewModal.classList.add("active");
}

// CLOSE QUICK VIEW
if (quickViewClose && quickViewModal) {
    quickViewClose.addEventListener("click", () => {
        quickViewModal.classList.remove("active");
    });
}

if (quickViewModal) {
    quickViewModal.addEventListener("click", event => {
        if (event.target === quickViewModal) {
            quickViewModal.classList.remove("active");
        }
    });
}

// QUICK VIEW QUANTITY CONTROLS
if (quickViewPlus && quickViewQuantity) {
    quickViewPlus.addEventListener("click", () => {
        quickViewQuantityValue++;

        quickViewQuantity.textContent =
            String(quickViewQuantityValue);
    });
}

if (quickViewMinus && quickViewQuantity) {
    quickViewMinus.addEventListener("click", () => {
        if (quickViewQuantityValue > 1) {
            quickViewQuantityValue--;

            quickViewQuantity.textContent =
                String(quickViewQuantityValue);
        }
    });
}

// QUICK VIEW ADD TO CART
if (quickViewAddCart) {
    quickViewAddCart.addEventListener("click", () => {
        if (!quickViewProduct) return;

        addProductToCart(
            quickViewProduct,
            quickViewQuantityValue
        );

        if (quickViewModal) {
            quickViewModal.classList.remove("active");
        }
    });
}

// FILTER, SEARCH AND SORT
function updateProducts() {
    if (!productGrid) return;

    let updatedProducts = [...products];

    // CATEGORY FILTER
    if (selectedCategory !== "All") {
        updatedProducts = updatedProducts.filter(
            product => product.category === selectedCategory
        );
    }

    // SEARCH FILTER
    if (searchTerm !== "") {
        updatedProducts = updatedProducts.filter(product =>
            String(product.name || "")
                .toLowerCase()
                .includes(searchTerm) ||

            String(product.category || "")
                .toLowerCase()
                .includes(searchTerm) ||

            String(product.type || "")
                .toLowerCase()
                .includes(searchTerm)
        );
    }

    // SORT PRODUCTS
    if (selectedSort === "price-low") {
        updatedProducts.sort(
            (a, b) => Number(a.price) - Number(b.price)
        );

    } else if (selectedSort === "price-high") {
        updatedProducts.sort(
            (a, b) => Number(b.price) - Number(a.price)
        );

    } else if (selectedSort === "name") {
        updatedProducts.sort(
            (a, b) =>
                String(a.name || "").localeCompare(
                    String(b.name || "")
                )
        );
    }

    productGrid.innerHTML = "";

    // EMPTY RESULTS
    if (updatedProducts.length === 0) {
        productGrid.innerHTML = `
            <div class="no-results">
                <h3>No Products Found</h3>
                <p>Try changing your search or filter.</p>
            </div>
        `;

    } else {
        updatedProducts.forEach(displayProduct);
    }

    // PRODUCT COUNT
    if (productCount) {
        productCount.textContent =
            `${updatedProducts.length} products`;
    }
}

// CATEGORY FILTER BUTTONS
filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        filterButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        selectedCategory =
            button.textContent.trim();

        updateProducts();
    });
});

// LIVE SEARCH
if (productSearch) {
    productSearch.addEventListener("input", () => {
        searchTerm =
            productSearch.value.trim().toLowerCase();

        updateProducts();
    });
}

// SEARCH BUTTON
if (searchButton) {
    searchButton.addEventListener("click", () => {
        if (!productSearch) return;

        searchTerm =
            productSearch.value.trim().toLowerCase();

        updateProducts();
    });
}

// CLEAR SEARCH
if (clearSearch) {
    clearSearch.addEventListener("click", () => {
        if (productSearch) {
            productSearch.value = "";
        }

        searchTerm = "";

        updateProducts();
    });
}

// SORT PRODUCTS
if (sortSelect) {
    sortSelect.addEventListener("change", () => {
        selectedSort = sortSelect.value;

        updateProducts();
    });
}

// RESET FILTERS
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

        filterButtons.forEach(button => {
            button.classList.remove("active");

            if (button.textContent.trim() === "All") {
                button.classList.add("active");
            }
        });

        updateProducts();
    });
}

// INITIALIZE SHOP
(async function initializeShop() {
    await resumePendingAddToCart();
    await getProducts();
})();