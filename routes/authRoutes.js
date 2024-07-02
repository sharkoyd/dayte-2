const express = require("express");
const UserController = require("../controllers/userController");
const auth = require("../middleware/auth");
const verifiedPhoneNumber = require("../middleware/verifiedPhoneNumber");

const router = express.Router();

// Register a user
router.post("/register", UserController.register);

// Send a verification code to the user
router.post("/sendverificationcode", auth, UserController.sendVerificationCode);

// Verify the phone number of the user
router.post("/verifyphonenumber", auth, UserController.verifyPhoneNumber);

// Finish the profile of the user
router.post("/finishprofile", auth, UserController.finishProfile);

// Login a user
router.post("/login", UserController.login);

// Get the profile of the logged in user
router.get("/profile", auth, UserController.getProfile);

module.exports = router;
