const express = require("express");
const router = express.Router();
const Vehicle = require("../models/Vehicle");

//Here I define the route for the POST endpoint to create a new vehicle.
router.post("/", async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    const savedVehicle = await vehicle.save();
    res.status(201).json(savedVehicle);
  } catch (error) {
    res.status(500).json({
      message: "Error creating vehicle",
      error: error.message
    });
  }
});

//Define the route for the GET endpoint to get all vehicles.
module.exports = router;