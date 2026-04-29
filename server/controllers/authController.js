const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const sgMail = require("@sendgrid/mail");

//Configure SendGrid with the API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

//feature/KAN-61 Helper function to send activation email via SendGrid
const sendActivationEmail = async (email, firstName, activationToken) => {
  const activationLink = `${process.env.CLIENT_URL}/activate?token=${activationToken}`;

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM,
    subject: "Activa tu cuenta en TicoCars",
    html: `
      <h2>Hola, ${firstName}!</h2>
      <p>Gracias por registrarte en TicoCars. Para activar tu cuenta haz clic en el siguiente enlace:</p>
      <a href="${activationLink}" style="background-color:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">
        Activar cuenta
      </a>
      <p>Este enlace expira en 24 horas.</p>
      <p>Si no creaste esta cuenta, ignora este correo.</p>
    `,
  };

  await sgMail.send(msg);
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

    //feature/KAN-61 Generate a unique activation token that expires in 24 hours
    const activationToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    //Create the user with the padron data to autocomplete name fields
    const createUser = await User.create({
      username,
      email,
      password: hashPassword,
      cedula,
      firstName: padronData.nombre || "",
      lastName: `${padronData.apellidoPaterno || ""} ${padronData.apellidoMaterno || ""}`.trim(),
      authProvider: "local",
      //feature/KAN-61 Store activation token to verify later
      activationToken,
    });

    //feature/KAN-61 Send activation email via SendGrid
    await sendActivationEmail(createUser.email, createUser.firstName, activationToken);

    //Send response without password
    res.status(201).json({
      message: "Usuario registrado. Revisa tu correo para activar tu cuenta.",
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

    //Send the token and username on response
    res.status(200).json({
      message: "Login exitoso. Bienvenido a TicoCars.",
      token,
      //KAN-62 Include username to navbar
      username: existUser.username,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor." });
  }
};

//GET /api/auth/validate-cedula endpoint to check a cedula against the padron API
const validateCedula = async (req, res) => {
  try {
    const { cedula } = req.query;

    //Validate that cedula is present
    if (!cedula) {
      return res.status(400).json({ message: "La cédula es requerida." });
    }

    //Validate cedula format, must be 9 digits
    if (!/^\d{9}$/.test(cedula)) {
      return res.status(400).json({ message: "La cédula debe tener 9 dígitos." });
    }

    //Check cedula against the padron API
    const padronData = await checkCedula(cedula);

    if (!padronData || padronData[0] === "No encontrado") {
      return res.status(404).json({ message: "La cédula no existe en el padrón electoral." });
    }

    //Return the padron data to autocomplete the form
    res.status(200).json(padronData);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor." });
  }
};

//KAN-61 GET /api/auth/activate endpoint to activate a user account
const activateAccount = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token de activación requerido." });
    }

    //Verify the activation token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //Find the user by email and activation token
    const user = await User.findOne({ email: decoded.email, activationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Token de activación inválido o ya fue usado." });
    }

    //Activate the account and remove the activation token
    user.status = "active";
    user.activationToken = null;
    await user.save();

    res.status(200).json({ message: "Cuenta activada exitosamente. Ya puedes iniciar sesión." });

  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Token inválido o vencido." });
  }
};

module.exports = {
  registerUser,
  loginUser,
  validateCedula,
  activateAccount,
};