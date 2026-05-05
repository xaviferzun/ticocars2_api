const express = require("express");
const router = express.Router();
const Answer = require("../models/Answer");
const Question = require("../models/Question");
const Vehicle = require("../models/Vehicle");
const {authenticate} = require("../middlewares/authMiddleware");
const {validateMessage} = require("../services/AIService");

//KAN-37 Here I define the route for the POST endpoint to create a new answer related to a question. The user must be authenticated and must be the owner of the vehicle related to the question to answer it.
router.post("/", authenticate, async (req, res) => {
  try {
    const { questionId, text } = req.body;

    // Validate fields
    if (!questionId || !text || text.trim() === "") {
      return res.status(400).json({
        message: "Datos inválidos",
      });
    }
    //Validate questiomn
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        message: "Pregunta no encontrada",
      });
    }
    //Check if question already has an answer
    const existingAnswer = await Answer.findOne({
      question: questionId,
    });
    if (existingAnswer) {
      return res.status(400).json({
          message: "Esta pregunta ya fue respondida",
      });
    }
    //Get vehicle related to the question
    const vehicle = await Vehicle.findById(question.vehicle);
    if (!vehicle) {
      return res.status(404).json({
        message: "Vehículo no encontrado",
      });
    }
    //Validate owner
    if (!vehicle.owner || vehicle.owner.toString() !== req.user.id) {
      return res.status(403).json({
        message: "No autorizado",
      });
    }
    //KAN-71 Validate message for personal information
    const isBlocked = await validateMessage(text);
    if (isBlocked) {
      return res.status(400).json({message: "El mensaje contiene información personal no permitida"});
    }
        
    //Make answer
    const answer = new Answer({
      question: questionId,
      user: req.user.id,
      text,
    });
    await answer.save();

    return res.status(201).json({
      message: "Respuesta creada correctamente",
      answer,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error del servidor",
      error: error.message,
    });
  }
});

module.exports = router;