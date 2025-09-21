// src/routes/customerRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // temp local; we upload to Cloudinary then remove
const cpUpload = upload.fields([
  { name: "cccdImage", maxCount: 1 },
  { name: "driverLicenseImage", maxCount: 1 },
]);

const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management
 */

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get customers (paginated)
 *     tags: [Customers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *
 *   post:
 *     summary: Create customer (with optional images)
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               cccd: { type: string }
 *               driverLicense: { type: string }
 *               notes: { type: string }
 *               cccdImage: { type: string, format: binary }
 *               driverLicenseImage: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Customer created
 */
router.get("/", getCustomers);
router.post("/", cpUpload, createCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by id
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *
 *   put:
 *     summary: Update customer by id
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               cccd: { type: string }
 *               driverLicense: { type: string }
 *               notes: { type: string }
 *               cccdImage: { type: string, format: binary }
 *               driverLicenseImage: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Updated
 *
 *   delete:
 *     summary: Delete customer by id
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Deleted
 */
router.get("/:id", getCustomerById);
router.put("/:id", cpUpload, updateCustomer);
router.delete("/:id", deleteCustomer);

module.exports = router;
