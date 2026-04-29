const mongoose = require("mongoose");

//User schema 
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
      //Not required for google users
      required: false,
    },

    cedula: {
      type: String,
      trim: true,
    },

    firstName: {
      type: String,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    //Indicates if the user registered with email/password or Google
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    //Account status, pending until email is verified
    status: {
      type: String,
      enum: ["pending", "active"],
      default: "pending",
    },

    //KAN-61 Token used to activate the account via email
    activationToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);