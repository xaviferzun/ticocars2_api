const mongoose = require("mongoose");

//Here I define the vehicle schema with brand, model, year, price, description, owner, images and status.
const vehicleSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: true,
    trim: true
  },

  model: {
    type: String,
    required: true,
    trim: true
  },

  year: {
    type: Number,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  description: {
    type: String,
    trim: true
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  images: [
    {
      type: String
    }
  ],

  status: {
    type: String,
    enum: ["available", "sold"],
    default: "available"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

//Export the model
module.exports = mongoose.model("Vehicle", vehicleSchema);