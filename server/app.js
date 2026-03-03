const express = require("express");
const app = express();

//Middleware global
app.use(express.json());

//Here import the auth routes 
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

//Ruta base para probar que el servidor funcione
app.get("/", (req, res) => {
  res.json({ message: "TicoCars-API corriendo correctamente" });
});

module.exports = app;