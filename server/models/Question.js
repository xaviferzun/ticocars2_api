const mongoose = require("mongoose");

//Define Question schema
const questionSchema = new mongoose.Schema(
  {
    //Reference to the user who asked the question
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    //Reference to the vehicle related to the question
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    //Question text
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

//Export model
module.exports = mongoose.model("Question", questionSchema);