const Order = require ("../models/order")
const { verifyToken } = require("../middlewares/verify")
const Product = require("../models/product")

// create order
const createOrder = async (req, res) => {
    console.log("ran")
    try {
        const userId = req.user.userId
        console.log(req.user.userId)
        if(!userId) return res.status(403).json("Forbidden access")
        const {items, shippingAddress} = req.body;
               let totalAmount = 0;       

        if (!items) return res.status(400).json("Fill in basic requirements before proceeding")
             

            for (const item of items) {
                   if (item.quantity <= 0 || !Number.isInteger(item.quantity)) return res.status(400).json("Quantity must be a positive or whole number")
                    const product = await Product.findByIdAndUpdate(
                {
                    _id: item.productId,
                    stock: { $gte: item.quantity}
                },
                    {
                        $inc: { stock: -item.quantity}
                    },
                );
                console.log(product.name)
                console.log(item.name)
                if (item.name != product.name) return res.status(403).json("Product name is inconsistent, Enter Accurate name")
                    if(product.stock <= 0) return res.status(400).json("Insufficient stock available")
                if (!product) return res.status(400).json("Product not found or insufficient stock")
            item.price = product.price
        const itemTotal = item.price * item.quantity
        totalAmount += itemTotal
          
        }
            const newOrder = await Order.create({items, userId, shippingAddress, totalAmount})
        res.status(201).json("New order created")
            
         
    } catch (err) {
         console.log (err)
        res.status(500).json("Internal server error")

    }
}

//update order quantity
const updateQuantity = async (req, res) => {
    try {
        const { orderId } = req.params;
        const {quantity, productId} = req.body
        if (!req.body) return res.status(400).json("Fill in the neccessary details")
        const order = await Order.findById(orderId)
     if (!order) return res.status(404).json("Order not found")
     if(order.userId != req.user.userId) return res.status(403).json("You are not allowed to update this order")
       
            const item = order.items.find(item => item.productId = productId)
            if(!item) return res.status(404).json("Product not found in this order")
                item.quantity = quantity;
            let totalAmount = 0;
            for (const item of order.items) {
                totalAmount += item.price * item.quantity
            }
            order.totalAmount = totalAmount

            await order.save();

            res.status(200).json({totalAmount: order.totalAmount})

    } catch(err) {
        res.status(500).json("Internal server error")
    }
}

// update shipping address
const updateAddress = async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log(orderId)
        const { newAddress } = req.body;
        console.log(req.body)
        const order = await Order.findOne({_id: orderId})
        if(!order) res.status(404).json("Order not found")
         console.log(order)
         if(order.userId != req.user.userId) return res.status(403).json("You are not allowed to update this order")
            order.shippingAddress = newAddress
        order.save()
        res.status(200).json("Shipping address updated successfully")
    } catch (err) {
        res.status(500).json("Internal Server error")
        console.log(err)
    }
}

// update order status 
const updateStatus = async (req, res) => {
    try {
    const {orderId} = req.params
        const {orderStatus} = req.body;
        if(req.user.role !== "admin") return res.status(403).json ("Unauthorized access, admins only")
        const order = await Order.findOne({_id: orderId})
    if (!order) return res.status(404).json("Order not found")
        order.status = orderStatus;
    order.save()
    res.status(200).json("Order status updated")
    } catch (err) {
        res.status(500).json("Internal server error")
    }
}

// cancel order
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId)
         if(!order) return res.status(404).json("Order not found")
        if (order.userId != req.user.userId || req.user.role !== "admin") return res.status(403).json("You are not permitted to cancel this order")

            if (order.status !== "pending") return res.status(403).json("Order has ben finalized, can't cancel this order")
                for (const item of order.items) {
                   const product = await Product.findById(item.productId)
        if (!product) return res.status(404).json(`${item.name} product, not found`)
            const newStock = product.stock += item.quantity
        product.stock = newStock;
        product.save()
        }
                order.status = "cancelled";
            order.save()
             
            res.status(200).json({status: order.status})
    } catch (err) {
        res.status(500).json("Internal server error")
    }
}

// get order
const getOrder = async (req, res) => {
    try {
        const {orderId} = req.params;
        const order = await Order.findById(orderId)
         if (!order) return res.status(404).json("Order not found")
        if (order.userId != req.user.userId || req.user.role !== "admin") return res.status (403).json("You are not permitted to view this order")
            res.status(200).json(order)
    } catch (err) {
        res.status(500).json("Internal server error")
    }
}

//get my orders
const myOrder = async (req, res) => {
    try {
        const { userId } = req.params;
        if (req.user.userId != userId) return res.status(403).json("you are not allowed to view the orders")
            const orders = await Order.find({userId});
        if(!orders) return res.status (404).json("There is no order associated with your account")
            res.status(200).json(orders)
    } catch (err) {
        console.log (err)
        res.status(500).json("Internal server error")
    }
}

//admins getting all existing orders in the database
const allOrders = async (req, res) => {
    try {
        if (req.user.role != "admin") return res.status(401).json("Unauthorized access, Admins only")
        const orders = await Order.find()
    if(!orders) res.status(404).json("No orders yet")
        res.status(200).json(orders)
    } catch (err) {
        res.status(500).status("Internal server error")
    }
}

//payment controller
// const  = async (req, res) => {

// }

module.exports = { createOrder,
    updateQuantity,
    updateAddress,
    updateStatus,
    cancelOrder,
    getOrder,
    myOrder,
    allOrders
 }