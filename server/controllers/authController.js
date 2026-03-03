const bcrypt = require("bcrypt");
const User = require("../models/User");

//Here I create the POST /api/auth/register endpoint to register a new user in TicoCars

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    //Type validation to avoid missing fields
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Todos los campos son requeridos.",
      });
    }


    //Verify if email exists
    const existsUser = await User.findOne({ email });

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

module.exports = {
  registerUser,
};