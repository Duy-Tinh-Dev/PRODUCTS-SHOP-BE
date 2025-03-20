const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const swaggerDocs = require("./swagger");

const db = require("./config/db");
const productRoutes = require("./routes/product");
const categoryRoutes = require("./routes/category");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// API routes
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);

// Setup Swagger documentation
swaggerDocs(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
