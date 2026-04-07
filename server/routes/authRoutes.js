const express = require("express");
const router = express.Router();
const {registerUser, loginUser, validateCedula} = require("../controllers/authController");
const authenticate = require("../middlewares/authMiddleware");
const passport = require("../config/passportConfig");
const jwt = require("jsonwebtoken");

//Here I define the route for the register POST endpoint. Call the register function from authController
router.post("/register", registerUser);
router.post("/login", loginUser);

//Route to validate a cedula against the padron API
router.get("/validate-cedula", validateCedula);

//Route to start Google OAuth2 flow, requests email and profile data
router.get("/google", passport.authenticate("google", { scope: ["email", "profile"], session: false }));

//Callback route that Google redirects to after authentication
router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:5173/login", session: false }),
  (req, res) => {
    //Generate JWT token for the authenticated user
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    //Redirect to frontend with the token as query param
    res.redirect(`http://localhost:5173/google-callback?token=${token}`);
  }
);

router.get("/profile", authenticate, (req, res) => {
  res.json({message: "Access granted", user: req.user});
});

module.exports = router;