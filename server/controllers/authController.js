const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

//Here I create the POST /api/auth/register endpoint to register a new user in TicoCars

const registerUser = async (req, res) => {
  try {
    const {username, email, password} = req.body;

    //Type validation to avoid missing fields
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Todos los campos son requeridos.",
      });
    }


    //Verify if email exists
    const existsUser = await User.findOne({email});

    if (existsUser) {
      return res.status(400).json({
        message: "El email ya se encuentra registrado en TicoCars.",
      });
    }


    //Make the hash
    const hashComplex = 8;
    const hashPassword = await bcrypt.hash(password, hashComplex);

    //Then I create the user with the hash password
    const createUser = await User.create({
      username,
      email,
      password: hashPassword,
    });


    //Send response without password
    res.status(201).json({
      message: "Usuario registrado exitosamente en TicoCars.",
      user: {
        id: createUser._id,
        username: createUser.username,
        email: createUser.email,
      },
    });


  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error del servidor",
    });
  }
};


//Here I create the POST /api/auth/login endpoint to login a user in TicoCars and get a JWT token

const loginUser = async (req, res) => {
  try {
    const {email, password} = req.body;

    //Same type validation to avoid missing fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email y contraseña son requeridos.",
      });
    }


    //Verify if user exists
    const existUser = await User.findOne({email});

    if (!existUser) {
      return res.status(401).json({
        message: "Credenciales inválidas.",
      });
    }

    //Compare the password with the hash on database
    const correctPassword = await bcrypt.compare(password, existUser.password);
    if (!correctPassword) {
      return res.status(401).json({
        message: "Credenciales inválidas.",
      });
    }

    //Here I create the JWT token with the user id 
    //The token expire in 1 hour
    const token = jwt.sign(
      {id: existUser._id},
      process.env.JWT_SECRET,
      {expiresIn: "1h"}
    );

    //Send the token on response
    res.status(200).json({
      message: "Login exitoso. Bienvenido a TicoCars.",
      token,
    });


  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error del servidor.",
    });
  }
};


module.exports = {
  registerUser,
  loginUser,
};