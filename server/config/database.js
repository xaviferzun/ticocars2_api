//Config the connection to the database using Mongoose
const mongoose = require("mongoose");

//Function to connect to the database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

//Ezxport the function to use it on server.js
module.exports = connectDB;
