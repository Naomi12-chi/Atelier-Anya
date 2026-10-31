const mongoose = require ("mongoose");
const newUser = mongoose.Schema ({
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String,  required: true },
    role: { type: String,  enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true}
});

const User = mongoose.model ( "User", newUser );

module.exports = User;