// src/index.js
require("dotenv").config(); // MUST be first
const express = require("express");
const cors = require("cors");

const connectDB = require("./src/config/db");
const { swaggerUi, specs } = require("./src/config/swagger");
const customerRoutes = require("./src/routes/customerRoutes");
const vehicleRoutes = require("./src/routes/vehicleRoutes");
const { notFound, errorHandler } = require("./src/middleware/errorMidleware");
const bookingRoutes = require("./src/routes/bookingRoutes");
const userRoutes = require("./src/routes/userRoutes");
// connect DB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// swagger
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true })
);

// routes
app.use("/api/customers", customerRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
// health
app.get("/", (req, res) => res.send("Motor Rental API running. See /api-docs"));

// error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
