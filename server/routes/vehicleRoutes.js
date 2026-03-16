const express = require("express");
const router = express.Router();
const Vehicle = require("../models/Vehicle");

//Here I define the route for the POST endpoint to create a new vehicle.
router.post("/", async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    const savedVehicle = await vehicle.save();
    res.status(201).json(savedVehicle);
  } 
    catch (error) {
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
  } 
    catch (error) {
      res.status(500).json({
        message: "Error al recuperar el vehículo",
        error: error.message
    });
  }
});

//Here I define the route to update a vehicle by its ID
router.put("/:id", async (req, res) => {
  try {
    const updVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new: true}
    );
    if (!updVehicle) {
      return res.status(404).json({
        message: "Vehículo no encontrado"
      });
    }
    res.json(updVehicle);
  }
    catch (error) {
      res.status(500).json({
        message: "Error al actualizar el vehículo",
        error: error.message
    });
  }
});

//Here I define the route to mark a vehicle as sold 
router.delete("/:id/sold", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        message: "Vehículo no encontrado"
      });
    }
    vehicle.status = "sold";
    await vehicle.save();
    res.json({
      message: "Vehículo marcado como vendido",
      vehicle
    });
  } 
    catch (error) {
      res.status(500).json({
        message: "Error al marcar el vehículo como vendido",
        error: error.message
    });
  }
});

//Export the vehicle routes
module.exports = router;