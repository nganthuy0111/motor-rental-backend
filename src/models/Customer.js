// src/models/Customer.js
const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: String,
    public_id: String,
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    cccd: { type: String, trim: true },
    driverLicense: { type: String, trim: true },
    cccdImage: imageSchema,
    driverLicenseImage: imageSchema,
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
