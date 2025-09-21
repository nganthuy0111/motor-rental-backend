const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    licensePlate: { type: String, required: true, unique: true },
    type: { type: String, required: true }, // ví dụ: tay ga, số, côn
    brand: { type: String, required: true }, // ví dụ: Honda, Yamaha
    status: {
      type: String,
      enum: ["available", "rented", "maintenance"],
      default: "available",
    },
    pricePerDay: { type: Number, required: true },
    images: [{ type: String }], // Cloudinary URLs
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
