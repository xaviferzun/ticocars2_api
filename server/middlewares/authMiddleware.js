const jwt = require("jsonwebtoken");
const User = require("../models/User");

//Here I created a middleware to protect routes that require authentication.
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    //Verify if the token exists
    if (!authHeader) {
      return res.status(401).json({ message: "Token no encontrado." });
    }

    //Extract token from "Bearer TOKEN"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Formato de token inválido." });
    }

    //Token verification. If the token is valid return the decoded user data
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //KAN-60 Fetch user from database to check current status
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado." });
    }

    //KAN-60 Block access if account is not yet activated
    if (user.status !== "active") {
      return res.status(403).json({ message: "Cuenta no verificada. Revisa tu correo electrónico." });
    }

    //Attach user data to request
    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({ message: "Token inválido o vencido." });
  }
};

//KAN-73 Middleware that only verifies JWT without checking account status
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({message: "Token no encontrado."});
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({message: "Formato de token inválido."});
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({message: "Usuario no encontrado."});
    }

    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({message: "Token inválido o vencido."});
  }
};

module.exports = {authenticate, authenticateToken};