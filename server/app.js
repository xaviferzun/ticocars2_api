const express = require("express");
const app = express();
const cors = require("cors");

//Middleware global
app.use(express.json());
app.use(cors());

//Here import the auth routes 
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
//Here import the vehicle routes
const vehicleRoutes = require("./routes/vehicleRoutes");
app.use("/api/vehicles", vehicleRoutes);
//Here import the question routes
const questionRoutes = require("./routes/questionRoutes");
app.use("/api/questions", questionRoutes);

//Ruta base para probar que el servidor funcione
app.get("/", (req, res) => {
  res.json({ message: "TicoCars-API corriendo correctamente" });
});

module.exports = app;