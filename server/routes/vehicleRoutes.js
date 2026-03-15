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
      message: "Error al crear el vehículo",
      error: error.message
    });
  }
});

//Here I define the route to get a vehicle by its ID
router.get("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        message: "Vehículo no encontrado"
      });
    }
    res.json(vehicle);

  } catch (error) {
    res.status(500).json({
      message: "Error al recuperar el vehículo",
      error: error.message
    });
  }
});


//Define the route for the GET endpoint to get all vehicles.
module.exports = router;