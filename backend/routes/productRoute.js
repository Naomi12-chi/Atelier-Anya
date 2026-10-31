const express = require ("express");
const { verifyToken } = require ("../middlewares/verify")
const { addProduct,
     getProducts,
     getProduct,
     updatePrice,
     deleteProduct,
     updateStock,
     viewProducts
    } = require ("../controllers/productController");
const upload = require("../middlewares/multer");
const router = express.Router();
router.post("/", upload.single("file"), verifyToken, addProduct)
router.get("/allProducts", getProducts)
router.get("/getProduct/:name", getProduct)
router.get("/viewProducts", verifyToken, viewProducts )
router.patch("/updatePrice/:name", verifyToken, updatePrice)
router.delete("/deleteProduct/:name", verifyToken, deleteProduct)
router.patch("/updatestock/:productId", verifyToken, updateStock)
module.exports = router;