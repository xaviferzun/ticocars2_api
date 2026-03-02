const express = require("express");
const app = express();

//Middleware global
app.use(express.json());

//Ruta base para probar que el servidor funcione
app.get("/", (req, res) => {
  res.json({ message: "TicoCars API running" });
});

module.exports = app;