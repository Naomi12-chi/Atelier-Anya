
require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/product");
const imageAssignments = require("./imageAssignments");
const fs = require("fs");
const path = require("path");

const manifestPath = path.join(
    __dirname,
    "cloudinary-image-manifest.json"
);

async function updateProductImages() {
    try {
        // Connect to your existing local database
        await mongoose.connect(
            "mongodb://localhost:27017/myEcommerce"
        );

        console.log("Connected to local MongoDB.");

        const manifest = JSON.parse(
            fs.readFileSync(manifestPath, "utf8")
        );

        const imageMap = new Map(
            manifest.map(image => [
                image.filename,
                image.secure_url
            ])
        );

        const assignments = Object.entries(imageAssignments);

        const products = await Product.find({
            name: {
                $in: assignments.map(([name]) => name)
            }
        }).select("_id name productImage").lean();

        const updates = [];

        // Verify every mapping before changing anything
        for (const [name, filename] of assignments) {
            const matches = products.filter(
                product => product.name === name
            );

            const imageUrl = imageMap.get(filename);

            if (matches.length !== 1 || !imageUrl) {
                throw new Error(
                    `Mapping problem for: ${name}. No updates made.`
                );
            }

            updates.push({
                product: matches[0],
                imageUrl
            });
        }

        // Save a backup of existing image values
        const backup = updates.map(({ product }) => ({
            id: product._id,
            name: product.name,
            previousProductImage: product.productImage || null
        }));

        const backupPath = path.join(
            __dirname,
            `product-image-backup-${Date.now()}.json`
        );

        fs.writeFileSync(
            backupPath,
            JSON.stringify(backup, null, 2)
        );

        console.log("Backup created:", backupPath);

        // Update ONLY the productImage field
        let updated = 0;

        for (const { product, imageUrl } of updates) {
            const result = await Product.updateOne(
                { _id: product._id },
                {
                    $set: {
                        productImage: imageUrl
                    }
                }
            );

            if (result.matchedCount !== 1) {
                throw new Error(
                    `Product update failed: ${product.name}`
                );
            }

            updated++;
            console.log(`Updated: ${product.name}`);
        }

        console.log("\n========== UPDATE COMPLETE ==========");
        console.log(`Products updated: ${updated}`);
        console.log("Only productImage fields were changed.");

    } catch (error) {
        console.error("UPDATE ERROR:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("MongoDB disconnected.");
    }
}

updateProductImages();
