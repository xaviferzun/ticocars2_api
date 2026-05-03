const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const sgMail = require("@sendgrid/mail");
const twilio = require("twilio");
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

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
    const {username, email, password, cedula, phone} = req.body;

    //Validate that all fields are present including cedula
    if (!username || !email || !password || !cedula || !phone) {
      return res.status(400).json({
        message: "Todos los campos son requeridos.",
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
      //KAN-61 Store activation token to verify later
      activationToken,
      phone: req.body.phone,
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

    //KAN-64 Send SMS verification code via twilio
    await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({
        to: `+506${existUser.phone}`,
        channel: "sms",
      });

    //KAN-64 Return user id so frontend can send it back when verifying the code
    res.status(200).json({
      message: "Código de verificación enviado a tu teléfono.",
      userId: existUser._id,
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

    //Find user by email from the token
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(400).json({ message: "Usuario no encontrado." });
    }

    //Confirm it if the account is active
    if (user.status === "active") {
      return res.status(200).json({ message: "Cuenta activada exitosamente. Ya puedes iniciar sesión." });
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


//KAN-64 POST /api/auth/verify-2fa endpoint to verify the SMS code and return the JWT
const verify2FA = async (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) {
      return res.status(400).json({ message: "El usuario y codigo son requeridos." });
    }

    //Find usr
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    //Verify the code with twilio verification
    const result = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({
        to: `+506${user.phone}`,
        code,
      });
    if (result.status !== "approved") {return res.status(400).json({ message: "Codigo incorrecto o vencido." });}

    //Code is valid, generate and return the JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login exitoso. Bienvenido a TicoCars.",
      token,
      username: user.username,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor." });
  }
};

//KAN-73 POST /api/auth/google-cedula endpoint to validte cedula for Google user
const validateGoogleCedula = async (req, res) => {
  try {
    const { cedula } = req.body;

    //Validate the  cedula format
    if (!cedula || !/^\d{9}$/.test(cedula)) {
      return res.status(400).json({message: "La cédula debe tener 9 dígitos."});
    }

    //The cedula alredady exists
    const existsCedula = await User.findOne({cedula, _id: {$ne: userId}});
    if (existsCedula) {
      return res.status(400).json({message: "Esa cédula ya está registrada en TicoCars."});
    }

    //Validate cedula on the padron API
    const padronData = await checkCedula(cedula);
    if (!padronData || padronData[0] === "No encontrado") {
      return res.status(400).json({message: "La cédula ingresada no existe en el padrón electoral."});
    }

    //pendiente: actualizar el usuario con la cédula
    //pentiende: activar la cuenta del usuaro


  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor." });
  }
};



module.exports = {
  registerUser,
  loginUser,
  validateCedula,
  activateAccount,
  verify2FA,
  //validateGoogleCedula,
};