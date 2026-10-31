const Product = require("../models/product");
const { verifyToken } = require("../middlewares/verify");
// const { post } = require("../routes/productRoute");
const { getBucket } = require("../middlewares/gridfs");
const { objectId } = require("mongodb");
const mongoose = require("mongoose");

//Add new product
const addProduct = async (req, res) => {
    console.log("ran")
  try {
    const { name, price, category, productImage, stock } = req.body;
    console.log(req.body.name)
    const bucket = getBucket();
    if (!bucket) {
      return res.status(500).json({ message: "GridFS not initilized" });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    if (!req.body) return res.status(401).json("Fill in product's credentials");
    if (req.user.role !== "admin")
      return res.status(401).json("Unauthorized access, Admins only");
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    uploadStream.end(req.file.buffer);
    uploadStream.on("finish", async () => {
      try {
        const newProduct = await Product.create({
          name,
          price,
          category,
          productImage,
          stock,
          userId: req.user.userId,
        });
        console.log(newProduct);
        res.status(201).json("Product successfully added");
      } catch (err) {
        console.error(err.message);
        res.status(500).json({
          message: err.message,
        });
      }
    });

    uploadStream.on("error", (err) => {
      console.error("GridFS upload error:", err);

      return res.status(500).json({
        message: "File upload Failed",
      });
    });

    // console.log(req.user.userId)
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal server error");
  }
};

//get all products
const getProducts = async (req, res) => {
  try {
    const allproducts = await Product.find();
    res.status(200).json(allproducts);
  } catch (err) {
    res.status(500).json("Internal server error");
  }
};

//get a product
const getProduct = async (req, res) => {
  try {
    const { name } = req.params;
    console.log(req.params)
    const singleProduct = await Product.findOne({name});
    console.log(singleProduct)
    if (!singleProduct) return res.status(404).json("Product not found");
    res.status(200).json(singleProduct);
  } catch (err) {
    console.log(err)
    res.status(500).json("Internal server error");
  }
};

// update product price
const updatePrice = async (req, res) => {
  try {
    const { price } = req.body;
    console.log(req.body)
    const { name } = req.params;
    const product = await Product.findOne({ name });
    console.log(product);
    console.log(product.userId);
    console.log(req.user.userId);
    if (product.userId != req.user.userId)
      return res.status(401).json("Unauthorized access");
    product.price = price;
    product.save();
    res.status(200).json(product);
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal server error");
  }
};

//delete product
const deleteProduct = async (req, res) => {
  try {
    const { name } = req.params;
    const deletedProduct = await Product.findOneAndDelete({ name });
    if (deletedProduct.userId != req.user.userId)
      return res.status(401).json("Unauthorized access");
    res.status(200).json("Product deleted");
  } catch (err) {
    res.status(500).json("Internal server error");
  }
};

//update stock
const updateStock = async (req, res) => {
  console.log("ran");
  try {
    const { productId } = req.params;
    console.log(productId)
    const { newStock } = req.body;
    if (req.user.role !== "admin")
      return res.status(403).json("unauthorized access, Admins only");
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json("Product not found");
    console.log(product)
    product.stock += newStock;
    
    product.save();
    res.status(201).json("Product stock updated successfully");
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal server error");
  }
};


// view total products number by admin
const viewProducts = async (req, res) => {

  try {
    if (req.user.role !== "admin") return res.status(403).json("Admins only")
    const allProducts = await Product.find();
  res.status(200).json(allProducts)
  } catch(err) {
    res.status(500).json("Internal server error")
  }
}
module.exports = {
  addProduct,
  getProducts,
  getProduct,
  updatePrice,
  deleteProduct,
  updateStock,
  viewProducts
};
