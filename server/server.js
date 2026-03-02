const app = require("./app");
const PORT = 3000;

//Inicio el servidor
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});