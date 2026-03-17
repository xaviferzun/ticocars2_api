const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const Vehicle = require("../models/Vehicle");
const authenticate = require("../middlewares/authMiddleware");

//KAN-35 Here I define the route for the POST endpoint to create a new question related to a vehicle.The user must be authenticated to ask a question.
router.post("/", authenticate, async (req, res) => {
  try {
    const { vehicleId, text } = req.body;

    //Validate input
    if (!text || text.trim() === "") {
      return res.status(400).json({
        message: "El texto de la pregunta es obligatorio",
      });
    }
    //Validate vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        message: "Vehículo no encontrado",
      });
    }

    //Create new question
    const question = await Question.create({
      user: req.user.id, //from auth middleware
      vehicle: vehicleId,
      text,
    });
    res.status(201).json({
      message: "Pregunta creada correctamente",
      question,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear la pregunta",
      error: error.message,
    });
  }
});

module.exports = router;