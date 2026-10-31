const mongoose = require("mongoose");
const newProduct = mongoose.Schema ({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: "String", required: true, enum: ["Skincare", "Makeup", "Fragrance", "Bodycare", "Haircare"]},
    productImage: { type: String },
     userId: {type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true

    },
    stock: {
        type: Number,
        required: true,
         default: 0,
        min: 0
    }

});

const Product = mongoose.model ("Product", newProduct)

module.exports = Product