const jwt = require("jsonwebtoken");

//Here I cereated a middleware to protect routes that require authentication.
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    //Verify if the token exists
    if (!authHeader) {
      return res.status(401).json({
        message: "Token no encontrado.",
      });
    }

    //Extract token from "Bearer TOKEN"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Formato de token inválido.",
      });
    }

    //Token verification. If the token is valid return the decoded user data
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //Attach user data to request
    req.user = decoded;
    next();

  } catch (error) {
    return res.status(401).json({
      message: "Token inválido o vencido.",
    });
  }
};

module.exports = authenticate;