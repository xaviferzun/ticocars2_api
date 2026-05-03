const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const Answer = require("../models/Answer");
const Vehicle = require("../models/Vehicle");   
const {authenticate} = require("../middlewares/authMiddleware");

//KAN-35 Here I define the route for the POST endpoint to create a new question related to a vehicle.
router.post("/", authenticate, async (req, res) => {
  try {
    const { vehicleId, text } = req.body;
    //Validate input
    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "El texto de la pregunta es obligatorio" });
    }
    //Validate vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }
    //Check if user already has a pending question on this vehicle
    const existingQuestion = await Question.findOne({
      user: req.user.id,
      vehicle: vehicleId,
    });
    if (existingQuestion) {
      const existingAnswer = await Answer.findOne({ question: existingQuestion._id });
      if (!existingAnswer) {
        return res.status(400).json({
          message: "Debes esperar a que respondan tu pregunta anterior",
        });
      }
    }

    //Create new question
    const question = await Question.create({
      user: req.user.id,
      vehicle: vehicleId,
      text,
    });

    res.status(201).json({ message: "Pregunta creada correctamente", question });
  } catch (error) {
    res.status(500).json({ message: "Error al crear la pregunta", error: error.message });
  }
});

//KAN-38 Here I define the route to get all questions made by the logged user
router.get("/mine", authenticate, async (req, res) => {
  try {
    const questions = await Question.find({ user: req.user.id }).populate("vehicle");
    return res.json(questions);
  } catch (error) {
    return res.status(500).json({ message: "Error del servidor", error: error.message });
  }
});

//KAN-39 Here I define the route to get all questions on vehicles owned by the logged user
router.get("/owner", authenticate, async (req, res) => {
  try {
    //Find vehicles owned by the user
    const vehicles = await Vehicle.find({ owner: req.user.id });
    const vehicleIds = vehicles.map((v) => v._id);
    //Find questions on those vehicles
    const questions = await Question.find({ vehicle: { $in: vehicleIds } })
      .populate("user", "username")
      .populate("vehicle", "brand model year");
    const answers = await Answer.find({
      question: { $in: questions.map((q) => q._id) },
    });

    //Attach answer text to each question
    const questionsWithAnswers = questions.map((q) => {
      const answer = answers.find((a) => a.question.toString() === q._id.toString());
      return { ...q.toObject(), answer: answer ? answer.text : null };
    });
    return res.json(questionsWithAnswers);
  } catch (error) {
    return res.status(500).json({ message: "Error del servidor", error: error.message });
  }
});

//KAN-40 Here I define the route to get questions made by the logged user with answers
router.get("/user", authenticate, async (req, res) => {
  try {
    const questions = await Question.find({ user: req.user.id })
      .populate("vehicle", "brand model year _id")
      .populate("user", "username");
    const answers = await Answer.find({
      question: { $in: questions.map((q) => q._id) },
    });
    //Attach answer to each question
    const questionsWithAnswers = questions.map((q) => {
      const answer = answers.find((a) => a.question.toString() === q._id.toString());
      return { ...q.toObject(), answer: answer ? answer.toObject() : null };
    });
    return res.json(questionsWithAnswers);
  } catch (error) {
    return res.status(500).json({ message: "Error del servidor", error: error.message });
  }
});

//KAN-43 Unified inbox endpoint — combines questions asked and received
router.get("/inbox", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    //Questions asked by the user
    const myQuestions = await Question.find({ user: userId })
      .populate("vehicle", "brand model year owner")
      .populate("user", "username");
    //Questions received on the user's vehicles
    const myVehicles = await Vehicle.find({ owner: userId });
    const vehicleIds = myVehicles.map((v) => v._id);
    const ownerQuestions = await Question.find({ vehicle: { $in: vehicleIds } })
      .populate("vehicle", "brand model year owner")
      .populate("user", "username");
    //Combine and remove duplicates
    const allQuestions = [...myQuestions, ...ownerQuestions];
    const uniqueQuestions = Array.from(
      new Map(allQuestions.map((q) => [q._id.toString(), q])).values()
    );

    //KAN-43 Get answers and populate the answering user
    const answers = await Answer.find({
      question: { $in: uniqueQuestions.map((q) => q._id) },
    }).populate("user", "username");

    //KAN-43 Attach full answer object to each question
    const result = uniqueQuestions.map((q) => {
      const answer = answers.find(
        (a) => a.question.toString() === q._id.toString()
      );
      return {
        ...q.toObject(),
        answer: answer ? answer.toObject() : null,
      };
    });

    //Sort by most recent first
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Error del servidor", error: error.message });
  }
});

module.exports = router;