const Product = require("../models/product");
const { verifyToken } = require("../middlewares/verify");
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

    if (!req.body) return res.status(401).json("Fill in product's credentials");
    if (req.user.role !== "admin")
      return res.status(401).json("Unauthorized access, Admins only");
    
    let finalProductImage = productImage || '';
    
    if (req.file) {
      const uploadStream = bucket.openUploadStream(req.file.originalname, {
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      uploadStream.end(req.file.buffer);
      uploadStream.on("finish", async () => {
        try {
          finalProductImage = finalProductImage || '/products/image/' + uploadStream.id;
          const newProduct = await Product.create({
            name,
            price,
            category,
            productImage: finalProductImage,
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
    } else {
      try {
        const newProduct = await Product.create({
          name,
          price,
          category,
          productImage: finalProductImage,
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
    }
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
};

// Serve image from GridFS
const getProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { getBucket } = require("../middlewares/gridfs");
    const bucket = getBucket();
    if (!bucket) {
      return res.status(500).json({ message: "GridFS not initialized" });
    }
    const mongoose = require("mongoose");
    let _id;
    try {
      _id = new mongoose.Types.ObjectId(id);
    } catch (e) {
      return res.status(404).json({ message: "Image not found" });
    }
    
    const files = await bucket.find({ _id: _id }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: "Image not found" });
    }
    
    const file = files[0];
    const contentType = (file.metadata && file.metadata.contentType) ? file.metadata.contentType : "image/jpeg";
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=31536000");
    
    const downloadStream = bucket.openDownloadStream(_id);
    downloadStream.on("error", (err) => {
      console.error(err);
      res.status(404).end();
    });
    downloadStream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(404).json({ message: "Image not found" });
  }
};

module.exports = {
  addProduct,
  getProducts,
  getProduct,
  updatePrice,
  deleteProduct,
  updateStock,
  viewProducts,
  getProductImage
};