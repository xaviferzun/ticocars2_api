const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");

//Middleware global
app.use(express.json());
app.use(cors());

//KAN-43 Serve uploaded images as static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

//Here import the auth routes 
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
//Here import the vehicle routes
const vehicleRoutes = require("./routes/vehicleRoutes");
app.use("/api/vehicles", vehicleRoutes);
//Here import the question routes
const questionRoutes = require("./routes/questionRoutes");
app.use("/api/questions", questionRoutes);
//Here import the answer routes
const answerRoutes = require("./routes/answerRoutes");
app.use("/api/answers", answerRoutes);

//Base route to check the API is running
app.get("/", (req, res) => {
  res.json({ message: "TicoCars-API corriendo correctamente" });
});

module.exports = app;