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
    const {brand, model, yearMin, yearMax, priceMin, priceMax, status} = req.query;
    //Pagination parameters with default values
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;

    //Calculate amount of documents to skip
    const skip = (page - 1) * limit;
    const filters = {};

    //Filters
    if (brand && brand.trim() !== "") {
      filters.brand = { $regex: brand, $options: "i"}; //Case-insensitive regex search
    }

    if (model && model.trim() !== "") {
      filters.model = { $regex: model, $options: "i"}; //Case-insensitive regex search
    }
    if (status) {
      filters.status = status;
    }
    if (yearMin || yearMax) {
      filters.year = {};
      if (yearMin) {
        filters.year.$gte = Number(yearMin);
      }
      if (yearMax) {
        filters.year.$lte = Number(yearMax);
      }
    }
    if (priceMin || priceMax) {
      filters.price = {};
      if (priceMin) {
        filters.price.$gte = Number(priceMin);
      }
      if (priceMax) {
        filters.price.$lte = Number(priceMax);
      }
    }
    //Count total results for pagination
    const totalResults = await Vehicle.countDocuments(filters);
    //Execute the paginated query
    const vehicles = await Vehicle.find(filters)
      .sort({ createdAt: -1 }) //date order -1 new first
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