const express = require ("express")
const { createAccount, 
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
} = require ("../controllers/userController.js")
const { verifyToken, verifyRole } = require ("../middlewares/verify.js");

const router = express.Router()

router.post ("/", createAccount)
router.post ("/login", loginUser)
router.delete("/:email", verifyToken, deleteAccount)
router.patch("/passwordReset", verifyToken, resetPassword)
router.patch("/profileUpdate/:userId", verifyToken, updateProfile)
router.patch ("/updateRole",verifyToken, updateRole)
router.patch("/isActive/:userEmail", verifyToken, updateIsActive)
router.get ("/myAccount/:userId",verifyToken, getMyAccount)
router.get("/getUser/:email", verifyToken, getAccountAdmin)
router.get("/users",verifyToken, getUsers)
router.get("/adminCheck", verifyToken, adminCheck)

module.exports = router;