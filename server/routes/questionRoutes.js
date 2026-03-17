const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const authenticate = require("../middlewares/authMiddleware");

//Here I define the route for the POST endpoint to create a new question related to a vehicle. The user must be authenticated to ask a question.
router.post("/", authenticate, async (req, res) => {
  try {
    const { vehicle, text } = req.body;
    const question = await Question.create({
      user: req.user.id, //From token
      vehicle,
      text,
    });
    
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({
      message: "Error al crear la pregunta",
      error: error.message,
    });
  }
});

module.exports = router;