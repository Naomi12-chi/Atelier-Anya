const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const KEY = process.env.SPECIAL_KEY;
const verifyUser = require("../middlewares/verify");

//create user account
const createAccount = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!req.body) return res.status(403).json("Fill in your details");
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role,
      name,
    });
    res.status(200).json("Your account has been created successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json("internal server error");
  }
};

//login account
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const loggedinUser = await User.findOne({ email });
    console.log(loggedinUser);
    if (!loggedinUser)
      return res.status(404).json("Not found, Enter accurate details");
    const validPassword = await bcrypt.compare(password, loggedinUser.password);
    if (!validPassword) return res.status(401).json("Invalid Password");
    if (loggedinUser.isActive === false)
      return res.status(403).json("Forbidden access, Account is deactivated");
    const token = jwt.sign(
      {
        userId: loggedinUser._id,
        userName: loggedinUser.name,
        userPassword: loggedinUser.password,
        email: loggedinUser.email,
        role: loggedinUser.role,
      },
      KEY,
      { expiresIn: "10m" },
    );
    return res.status(200).json({ token: token, Id: loggedinUser._id, role: loggedinUser.role });
  } catch (error) {
    console.log(error);
    res.status(500).json("internal error");
  }
};

// delete account
const deleteAccount = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) return res.status(404).json("Account not found");
    const deletedAccount = await User.findOneAndDelete({ email });
    // if (deletedAccount.isActive === false) return res.status(403).json("Deactivated accounts can't be deleted, try again once your account is restored")
    res.status(200).json("Your account has been deleted successfully");
  } catch (err) {
    res.status(500).json("Internal server error");
  }
};

//update password
const resetPassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res
        .status(400)
        .json("Fill in your current password and new Password");
    // if (email != req.user.email) return res.status(401).json("Unauthorized access")
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json("User not found, enter valid email");
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    console.log(currentPassword);
    console.log(user.password);
    if (!validPassword)
      return res.status(403).json("Current password is incorrect");
    const updatedPassword = await bcrypt.hash(newPassword, 10);
    user.password = updatedPassword;
    await user.save();
    res.status(200).json("password reset completed successfully");
  } catch (error) {
    res.status(500).json("Internal server error");
  }
};

//update profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.params;

    const { email, name } = req.body;
    console.log (req.body)
    const Id = req.user.userId;
    const user = await User.findByIdAndUpdate(Id, {email, name});
    console.log(user)
    if (!user) return res.status(404).json("User not found");
    if (user._id != req.user.userId)
      return res.status(401).json("Unauthorized");

    
    
    res.status(200).json("Data updated successfully");
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

//update role by admin
const updateRole = async (req, res) => {
  try {
    const { email, newRole } = req.body;
    console.log(req.user.role);
    if (req.user.role !== "admin")
      return res.status(401).json("Unauthorized access, admins only");
    const user = await User.findOneAndUpdate({ email });
    if (!user)
      return res.status(404).json("Account not found, enter valid email");

    user.role = newRole;
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json("internal server error");
  }
};

//update isActive status
const updateIsActive = async (req, res) => {
  try {
    const { email, isActive } = req.body;
    const { userEmail } = req.params;
    if (email !== userEmail)
      return res
        .status(401)
        .json("Inconsistent email address, enter accurate address");
    if (req.user.role !== "admin")
      return res.status(401).json("Unauthorized access, Admins only");
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json("User account not found");
    user.isActive = isActive;
    user.save();
    console.log(user.isActive);
    if (user.isActive === true)
      return res.status(200).json("User Account has been reactivated");
    if (user.isActive === false)
      return res.status(200).json("User account deactivated");
  } catch (error) {
    res.status(500).json("Internal server error");
  }
};

//get my account / profile page
const getMyAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId !== req.user.userId)
      return res.status(401).json("Unauthorized access");
    const user = await User.findById(userId);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json("Internal server error");
  }
};

// get account by admin
const getAccountAdmin = async (req, res) => {
  console.log("ran");
  try {
    
    const { email } = req.params;
    if (req.user.role !== "admin")
      return res.status(401).json("Unauthorized access, admins only");
    const user = await User.findOne({ email });
    console.log(user);
    res.status(200).json({
      message: "User data retrieved successfully",
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("internal server error");
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(401).json("Unauthorized access, admins only");
    const users = await User.find().select("name email role isActive -_id");
    res
      .status(200)
      .json({ message: "users data retrieved successfully", users });
  } catch (error) {
    res.status(500).json("Internal server error");
  }
};

//admin check for dashboard
const adminCheck = async (req, res) => {
  try {
    const id = req.user.userId;
    const user = await User.findById(id);
    if (req.user.role !== "admin") return res.status(403).json("Forbidden access, not an admin")
      res.status(200).json("Admin role authenticated")
  } catch(error) {
    res.status(500).json("Internal server error")
  }
}


module.exports = {
  createAccount,
  loginUser,
  deleteAccount,
  resetPassword,
  updateProfile,
  updateRole,
  updateIsActive,
  getMyAccount,
  getAccountAdmin,
  getUsers,
  adminCheck
};
