const express = require("express");
const router = express.Router();
const Vehicle = require("../models/Vehicle");
const authenticate = require("../middlewares/authMiddleware");
const ownerMiddleware = require("../middlewares/ownerMiddleware");

//KAN-24 Here I define the route for the POST endpoint to create a new vehicle.
router.post("/", authenticate, async (req, res) => {
  try {
    const vehicle = new Vehicle({...req.body, owner: req.user.id});
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

//KAN-25 Here I define the route to get a vehicle by its ID
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

//KAN-26 Here I define the route to update a vehicle by its ID
router.put("/:id", authenticate, ownerMiddleware, async (req, res) => {
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

//KAN-27 Here I define the route to delete a vehicle by ID
router.delete("/:id", authenticate, ownerMiddleware, async (req, res) => {
  try {
    const deleteVehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!deleteVehicle) {
      return res.status(404).json({
        message: "Vehículo no encontrado"
      });
    }
    res.json({
      message: "Vehículo eliminado correctamente",
      vehicle: deleteVehicle
    });
  } 
    catch (error) {
      res.status(500).json({
        message: "Error al eliminar el vehículo",
        error: error.message
    });
  }
});


//KAN-28 Here I define the route to update the vehicle status to sold
router.patch("/:id/sold", authenticate, ownerMiddleware, async (req, res) => {
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


//KAN-30/31 Here I define the route to get vehicles with filters and pagination
router.get("/", async (req, res) => {
  try {
    //Read query parameters
    const { brand, model, minYear, maxYear, minPrice, maxPrice, status } = req.query;
    //Pagination parameters with default values
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;

    //Calculate amount of documents to skip
    const skip = (page - 1) * limit;
    const filters = {};

    //Filters
    if (brand) {
      filters.brand = brand;
    }
    if (model) {
      filters.model = model;
    }
    if (status) {
      filters.status = status;
    }
    if (minYear || maxYear) {
      filters.year = {};
      if (minYear) {
        filters.year.$gte = Number(minYear);
      }
      if (maxYear) {
        filters.year.$lte = Number(maxYear);
      }
    }
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) {
        filters.price.$gte = Number(minPrice);
      }
      if (maxPrice) {
        filters.price.$lte = Number(maxPrice);
      }
    }
    //Count total results for pagination
    const totalResults = await Vehicle.countDocuments(filters);
    //Execute the paginated query
    const vehicles = await Vehicle.find(filters)
      .skip(skip)
      .limit(limit);
    //Calculate total pages
    const totalPages = Math.ceil(totalResults / limit);
    //Response
    res.json({
      totalResults,
      currentPage: page,
      totalPages,
      limit,
      results: vehicles
    });
  } 
    catch (error) {
      res.status(500).json({
        message: "Error al obtener los vehículos",
        error: error.message
    });
  }
});

//Export the vehicle routes
module.exports = router;