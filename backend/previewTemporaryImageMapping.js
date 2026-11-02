require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/product");
const temporaryImageAssignments = require("./temporaryImageAssignments");
const fs = require("fs");
const path = require("path");

const manifestPath = path.join(
    __dirname,
    "cloudinary-image-manifest.json"
);

async function previewTemporaryMapping() {
    try {
        await mongoose.connect(
            "mongodb://localhost:27017/myEcommerce"
        );

        const manifest = JSON.parse(
            fs.readFileSync(manifestPath, "utf8")
        );

        const imageMap = new Map(
            manifest.map(image => [
                image.filename,
                image.secure_url
            ])
        );

        const assignments = Object.entries(
            temporaryImageAssignments
        );

        const products = await Product.find({
            name: {
                $in: assignments.map(([name]) => name)
            }
        }).select("_id name productImage").lean();

        console.log("\n========== TEMPORARY IMAGE PREVIEW ==========\n");

        let ready = 0;

        for (const [productName, filename] of assignments) {
            const matches = products.filter(
                product => product.name === productName
            );

            const imageUrl = imageMap.get(filename);

            if (!imageUrl) {
                console.log(`MISSING IMAGE: ${filename}`);
                continue;
            }

            if (matches.length === 0) {
                console.log(`PRODUCT NOT FOUND: ${productName}`);
                continue;
            }

            if (matches.length > 1) {
                console.log(`DUPLICATE PRODUCT NAME: ${productName}`);
                continue;
            }

            console.log(`PRODUCT: ${productName}`);
            console.log(`IMAGE: ${filename}`);
            console.log(`CURRENT: ${matches[0].productImage || "No image"}`);
            console.log(`NEW URL: ${imageUrl}`);
            console.log("--------------------------------------");

            ready++;
        }

        console.log(`\nReady to update: ${ready}/${assignments.length}`);
        console.log("PREVIEW ONLY: No products were changed.");

    } catch (error) {
        console.error("Preview failed:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

previewTemporaryMapping();