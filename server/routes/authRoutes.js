const express = require("express");
const router = express.Router();
const {registerUser, loginUser} = require("../controllers/authController");

//Here I define the route for the register POST endpoint. Call the register function from authController
router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;