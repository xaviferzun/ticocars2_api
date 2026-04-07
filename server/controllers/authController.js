const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const axios = require("axios");

//URL of the padron API running locally
const PADRON_URL = process.env.PADRON_URL || "http://localhost:8080";

//Helper function to validate a cedula against the padron API
const checkCedula = async (cedula) => {
  try {
    const response = await axios.get(`${PADRON_URL}?cedula=${cedula}`);
    return response.data;
  } catch (error) {
    return null;
  }
};

//POST /api/auth/register endpoint to register a new user
const registerUser = async (req, res) => {
  try {
    const { username, email, password, cedula } = req.body;

    //Validate that all fields are present including cedula
    if (!username || !email || !password || !cedula) {
      return res.status(400).json({
        message: "Todos los campos son requeridos, incluyendo la cédula.",
      });
    }

    //Validate cedula format, must be 9 digits
    if (!/^\d{9}$/.test(cedula)) {
      return res.status(400).json({
        message: "La cédula debe tener 9 dígitos.",
      });
    }

    //Check cedula against the padron API
    const padronData = await checkCedula(cedula);

    if (!padronData || padronData[0] === "No encontrado") {
      return res.status(400).json({
        message: "La cédula ingresada no existe en el padrón electoral.",
      });
    }

    //Verify if email is already registered
    const existsUser = await User.findOne({ email });
    if (existsUser) {
      return res.status(400).json({
        message: "El email ya se encuentra registrado en TicoCars.",
      });
    }

    //Verify if cedula is already registered
    const existsCedula = await User.findOne({ cedula });
    if (existsCedula) {
      return res.status(400).json({
        message: "La cédula ya se encuentra registrada en TicoCars.",
      });
    }

    //Make the hash
    const hashComplex = 8;
    const hashPassword = await bcrypt.hash(password, hashComplex);

    //Create the user with the padron data to autocomplete name fields
    const createUser = await User.create({
      username,
      email,
      password: hashPassword,
      cedula,
      firstName: padronData.nombre || "",
      lastName: `${padronData.apellidoPaterno || ""} ${padronData.apellidoMaterno || ""}`.trim(),
      authProvider: "local",
    });

    //Send response without password
    res.status(201).json({
      message: "Usuario registrado exitosamente en TicoCars.",
      user: {
        id: createUser._id,
        username: createUser.username,
        email: createUser.email,
        firstName: createUser.firstName,
        lastName: createUser.lastName,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor." });
  }
};

//POST /api/auth/login endpoint to login a user in TicoCars and get a JWT token
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    //Validate that all fields are present
    if (!email || !password) {
      return res.status(400).json({
        message: "Email y contraseña son requeridos.",
      });
    }

    //Verify if user exists
    const existUser = await User.findOne({ email });
    if (!existUser) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    //Compare the password with the hash on database
    const correctPassword = await bcrypt.compare(password, existUser.password);
    if (!correctPassword) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    //Create the JWT token with the user id, expires in 1 hour
    const token = jwt.sign(
      { id: existUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    //Send the token on response
    res.status(200).json({
      message: "Login exitoso. Bienvenido a TicoCars.",
      token,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor." });
  }
};

module.exports = {
  registerUser,
  loginUser,
};