// src/controllers/vehicleController.js
const Vehicle = require("../models/Vehicle");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// CREATE vehicle
exports.createVehicle = async (req, res) => {
  try {
    const { licensePlate, type, brand, pricePerDay, status } = req.body;

    if (!licensePlate || !type || !brand || !pricePerDay) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "vehicles",
        });
        uploadedImages.push(result.secure_url);
        fs.unlinkSync(file.path); // xóa file tạm
      }
    }

    const vehicle = new Vehicle({
      licensePlate,
      type,
      brand,
      status: status || "available",
      pricePerDay,
      images: uploadedImages,
    });

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ all vehicles
exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ vehicle by ID
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const { licensePlate, type, brand, pricePerDay, status } = req.body;

    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "vehicles",
        });
        uploadedImages.push(result.secure_url);
        fs.unlinkSync(file.path);
      }
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        licensePlate,
        type,
        brand,
        pricePerDay,
        status,
        ...(uploadedImages.length > 0 && { images: uploadedImages }),
      },
      { new: true }
    );

    if (!updatedVehicle)
      return res.status(404).json({ error: "Vehicle not found" });

    res.json(updatedVehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const deleted = await Vehicle.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Vehicle not found" });
    res.json({ message: "Vehicle deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
