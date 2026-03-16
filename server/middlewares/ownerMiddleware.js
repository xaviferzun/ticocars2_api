const Vehicle = require("../models/Vehicle");

//KAN-29 Middleware to verify that the authenticated user
const ownerMiddleware = async (req, res, next) => {
  try {    
    const vehicleId = req.params.id;
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehículo no encontrado"
      });
    }
    //Compare vehicle owner with authenticated user
    if (vehicle.owner.toString() !== req.user.id) {
      return res.status(403).json({
        message: "No está autorizado para modificar este vehículo"
      });
    }
    next();
  }
    catch (error) {
        res.status(500).json({
        message: "Error al verificar el propietario del vehículo",
        error: error.message
    });
  }
};

//Export the middleware
module.exports = ownerMiddleware;