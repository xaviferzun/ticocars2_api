const mongoose = require("mongoose");

//Here I defiine the user schema with username, email and password.
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true, 
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },
  },
  {
    //Used to add createdAt and updatedAt fields
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("User", userSchema);