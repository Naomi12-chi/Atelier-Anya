const express = require("express");
require("dotenv").config();
const app = express();
const path = require("path")
const PORT = 4678;
const mongoose = require ("mongoose")
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));
<<<<<<< HEAD
mongoose.connect("mongodb://localhost:27017/myEcommerce")
=======
mongoose.connect("mongodb://localhost:27017/myEcommerce")
>>>>>>> origin/main
.then(() => {
  console.log("Database Connected")  
}) .catch((error) => {
    console.log(error.message)
})

const userRouter = require("./routes/router")
app.use("/user", userRouter)
const productRoute = require("./routes/productRoute")
app.use("/products", productRoute)
const orderRoute = require("./routes/orderRoute")
app.use("/orders", orderRoute)

app.listen (PORT, () => {
    console.log (`app is running on port ${PORT}`)
})