
const fs = require("fs");
const path = require("path");
const cloudinary = require("./cloudinary");

// Location of your product images
const imageFolder =
    "C:/Users/omoba/Downloads/Atelier-Anya-Product-Images";

// Where we'll save the uploaded image information
const manifestPath = path.join(
    __dirname,
    "cloudinary-image-manifest.json"
);

async function uploadImages() {
    try {
        const files = fs.readdirSync(imageFolder);

        // Select image files only, excluding the contact sheet
        const imageFiles = files.filter(file => {
            const extension = path.extname(file).toLowerCase();

            return (
                [".jpg", ".jpeg", ".png", ".webp"].includes(extension) &&
                file.toLowerCase() !== "contact-sheet.jpg"
            );
        });

        console.log(`Found ${imageFiles.length} images.`);

        const manifest = [];
        const failedUploads = [];

        for (const file of imageFiles) {
            const filePath = path.join(imageFolder, file);
            const publicId = path.parse(file).name;

            try {
                console.log(`Uploading: ${file}`);

                const result = await cloudinary.uploader.upload(
                    filePath,
                    {
                        folder: "atelier-anya",
                        public_id: publicId,
                        overwrite: true,
                        resource_type: "image"
                    }
                );

                manifest.push({
                    filename: file,
                    public_id: result.public_id,
                    secure_url: result.secure_url
                });

                console.log(`Uploaded successfully: ${file}`);

            } catch (error) {
                failedUploads.push({
                    filename: file,
                    error: error.message
                });

                console.log(`Failed: ${file}`);
                console.log(error.message);
            }
        }

        fs.writeFileSync(
            manifestPath,
            JSON.stringify(manifest, null, 2)
        );

        console.log("\n========== UPLOAD SUMMARY ==========");
        console.log(`Successful uploads: ${manifest.length}`);
        console.log(`Failed uploads: ${failedUploads.length}`);
        console.log(`Manifest saved to: ${manifestPath}`);

        if (failedUploads.length > 0) {
            console.log("\nFailed files:", failedUploads);
        }

    } catch (error) {
        console.error("Uploader error:", error.message);
    }
}

uploadImages();
