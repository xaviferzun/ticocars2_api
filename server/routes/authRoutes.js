const express = require("express");
const router = express.Router();
const {registerUser, loginUser} = require("../controllers/authController");
const authenticate = require("../middlewares/authMiddleware");

//Here I define the route for the register POST endpoint. Call the register function from authController
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authenticate, (req, res) => {
  res.json({message: "Access granted", user: req.user});
});

module.exports = router;