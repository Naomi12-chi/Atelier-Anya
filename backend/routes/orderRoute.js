const express = require("express")
const { verifyToken } = require ("../middlewares/verify")
const { createOrder, 
    updateQuantity,
     updateAddress, 
    updateStatus,
    cancelOrder,
    getOrder,
    myOrder,
    allOrders
 } = require ("../controllers/orderController")

const router = express.Router();
router.post("/createOrder", verifyToken, createOrder)
router.patch("/updateQuantity/:orderId", verifyToken,  updateQuantity)
router.patch("/updateAddress/:orderId", verifyToken, updateAddress)
router.patch ("/updateStatus/:orderId", verifyToken, updateStatus)
router.patch("/cancelOrder/:orderId", verifyToken, cancelOrder)
router.get("/order/:orderId", verifyToken, getOrder)
router.get("/myOrders/:userId", verifyToken, myOrder)
router.get("/allOrders", verifyToken, allOrders)


module.exports = router;