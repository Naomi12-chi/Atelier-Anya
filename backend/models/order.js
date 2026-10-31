const mongoose = require("mongoose");

const newOrder = new mongoose.Schema ({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
     totalAmount: {
            type: "Number",
            required: true
           },

            status: {
            type: String,
            enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
            default: "pending"
           },

           paymentStatus: {
            type: "String",
            enum: ["pending", "paid", "failed"],
            default: "pending"
           },

           shippingAddress: {
            type: "String",
            required: "true"
           },

    items: [
        {
           productId: { type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
           },

           price: { type: Number,
             required: true },

           name: {
            type: String, required: true
           },

           quantity: {
            type: Number,
            min: 1,
            required: true
           },

        }, 
    ]

}, { timestamps: true })

const Order = new mongoose.model ("Order", newOrder)

module.exports = Order;