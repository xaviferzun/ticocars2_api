const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const Answer = require("../models/Answer");
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

    //Check if user already has a pending question 
    const existingQuestion = await Question.findOne({
      user: req.user.id,
      vehicle: vehicleId,
    });
    if (existingQuestion) {
      const Answer = require("../models/Answer"); //import here if not at top
      const existingAnswer = await Answer.findOne({
        question: existingQuestion._id,
    });
    if (!existingAnswer) {
        return res.status(400).json({
        message: "Debes esperar a que respondan tu pregunta anterior",
        });
    }
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

//KAN-38 Here I define the route to get all questions related to a vehicle by its ID. This endpoint is public, no authentication is required.
router.get("/mine", authenticate, async (req, res) => {
  try {
    //Find all questions where user = logged user
    const questions = await Question.find({
      user: req.user.id,
    }).populate("vehicle");
    return res.json(questions);
  } catch (error) {
    return res.status(500).json({
      message: "Error del servidor",
      error: error.message,
    });
  }
});

//KAN-39 Here I define the route to get all questions related to the vehicles owned by the logged user. The user must be authenticated to access this endpoint.
router.get("/owner", authenticate, async (req, res) => {
  try {
    //Find vehicles owned by the user
    const vehicles = await Vehicle.find({
      owner: req.user.id,
    });

    //Extract vehicle IDs
    const vehicleIds = vehicles.map((vehicle) => vehicle._id);
    //Find questions related to those vehicles
    const questions = await Question.find({
      vehicle: { $in: vehicleIds },
    })
      .populate("user")     //Asker
      .populate("vehicle"); //Vehicle info
    return res.json(questions);
  } catch (error) {
    return res.status(500).json({
      message: "Error del servidor",
      error: error.message,
    });
  }
});
module.exports = router;