//Here I use dotenv to load environment variables, import the app and DB connection and start the server after connecting to DB
require("dotenv").config();
const app = require("./app");
const connection = require("./config/database");
const PORT = process.env.PORT || 3000;

//Function to connect the DB and start the server
const start = async () => {
  await connection();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start();