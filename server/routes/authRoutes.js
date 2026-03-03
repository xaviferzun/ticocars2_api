const express = require("express");
const router = express.Router();
const {registerUser} = require("../controllers/authController");

//Here I define the route for the register POST endpoint. Call the register function from authController
router.post("/register", registerUser);

module.exports = router;