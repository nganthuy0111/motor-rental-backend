// src/controllers/customerController.js
const fs = require("fs");
const Customer = require("../models/Customer");
const cloudinary = require("../config/cloudinary");

async function uploadAndRemoveTemp(file, folder = "motor-rental/customers") {
  const result = await cloudinary.uploader.upload(file.path, { folder });
  // remove temp file
  try {
    fs.unlinkSync(file.path);
  } catch (e) {}
  return { url: result.secure_url, public_id: result.public_id };
}

exports.createCustomer = async (req, res, next) => {
  try {
    const { name, phone, cccd, driverLicense, notes } = req.body;
    if (!name || !phone) {
      res.status(400);
      throw new Error("name and phone are required");
    }

    const newCustomer = new Customer({
      name,
      phone,
      cccd,
      driverLicense,
      notes,
    });

    if (req.files?.cccdImage?.[0]) {
      newCustomer.cccdImage = await uploadAndRemoveTemp(
        req.files.cccdImage[0],
        "motor-rental/cccd"
      );
    }
    if (req.files?.driverLicenseImage?.[0]) {
      newCustomer.driverLicenseImage = await uploadAndRemoveTemp(
        req.files.driverLicenseImage[0],
        "motor-rental/license"
      );
    }

    const saved = await newCustomer.save();
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
};

exports.getCustomers = async (req, res, next) => {
  try {
    let { page = 1, limit = 10, search } = req.query;
    page = Number(page);
    limit = Number(limit);
    const filter = {};
    if (search) {
      const rx = new RegExp(search, "i");
      filter.$or = [{ name: rx }, { phone: rx }, { cccd: rx }];
    }
    const total = await Customer.countDocuments(filter);
    const data = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    res.json({ page, limit, total, pages: Math.ceil(total / limit), data });
  } catch (err) {
    next(err);
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404);
      throw new Error("Customer not found");
    }
    res.json(customer);
  } catch (err) {
    next(err);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404);
      throw new Error("Customer not found");
    }

    const { name, phone, cccd, driverLicense, notes } = req.body;
    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (cccd) customer.cccd = cccd;
    if (driverLicense) customer.driverLicense = driverLicense;
    if (notes) customer.notes = notes;

    // replace images if new uploaded
    if (req.files?.cccdImage?.[0]) {
      // delete old image in cloud if exists
      if (customer.cccdImage?.public_id) {
        await cloudinary.uploader
          .destroy(customer.cccdImage.public_id)
          .catch(() => {});
      }
      customer.cccdImage = await uploadAndRemoveTemp(
        req.files.cccdImage[0],
        "motor-rental/cccd"
      );
    }
    if (req.files?.driverLicenseImage?.[0]) {
      if (customer.driverLicenseImage?.public_id) {
        await cloudinary.uploader
          .destroy(customer.driverLicenseImage.public_id)
          .catch(() => {});
      }
      customer.driverLicenseImage = await uploadAndRemoveTemp(
        req.files.driverLicenseImage[0],
        "motor-rental/license"
      );
    }

    const updated = await customer.save();
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404);
      throw new Error("Customer not found");
    }

    // delete cloud images if exist
    if (customer.cccdImage?.public_id) {
      await cloudinary.uploader
        .destroy(customer.cccdImage.public_id)
        .catch(() => {});
    }
    if (customer.driverLicenseImage?.public_id) {
      await cloudinary.uploader
        .destroy(customer.driverLicenseImage.public_id)
        .catch(() => {});
    }

    await customer.remove();
    res.json({ message: "Customer removed" });
  } catch (err) {
    next(err);
  }
};
