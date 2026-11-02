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

async function updateTemporaryImages() {
    try {
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

        const assignments = Object.entries(
            temporaryImageAssignments
        );

        const products = await Product.find({
            name: {
                $in: assignments.map(([name]) => name)
            }
        }).select("_id name productImage").lean();

        const updates = [];

        // Validate all assignments before updating anything
        for (const [name, filename] of assignments) {
            const matches = products.filter(
                product => product.name === name
            );

            const imageUrl = imageMap.get(filename);

            if (matches.length !== 1 || !imageUrl) {
                throw new Error(
                    `Validation failed for ${name}. No updates made.`
                );
            }

            updates.push({
                product: matches[0],
                imageUrl
            });
        }

        // Create a backup
        const backup = updates.map(({ product }) => ({
            id: product._id,
            name: product.name,
            previousProductImage: product.productImage || null
        }));

        const backupPath = path.join(
            __dirname,
            `temporary-image-backup-${Date.now()}.json`
        );

        fs.writeFileSync(
            backupPath,
            JSON.stringify(backup, null, 2)
        );

        console.log("Backup created:", backupPath);

        // Update only productImage
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
                    `Update failed for ${product.name}`
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

updateTemporaryImages();