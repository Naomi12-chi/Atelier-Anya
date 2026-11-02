require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/product");
const imageAssignments = require("./imageAssignments");

async function listRemainingProducts() {
    try {
        await mongoose.connect(
            "mongodb://localhost:27017/myEcommerce"
        );

        const assignedNames = Object.keys(imageAssignments);

        const remainingProducts = await Product.find({
            name: { $nin: assignedNames }
        }).select("name category productImage").lean();

        console.log("\n========== REMAINING PRODUCTS ==========\n");

        remainingProducts.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name}`);
            console.log(`   Category: ${product.category}`);
            console.log(`   Current image: ${product.productImage || "No image"}`);
            console.log("----------------------------------");
        });

        console.log(`\nRemaining products: ${remainingProducts.length}`);

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

listRemainingProducts();