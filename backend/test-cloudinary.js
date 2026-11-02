
const cloudinary = require("./cloudinary");

cloudinary.api.ping()
    .then(result => {
        console.log("Cloudinary connected:", result);
    })
    .catch(error => {
        console.error("Cloudinary connection failed:", error.message);
    });
