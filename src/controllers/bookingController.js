const Booking = require("../models/Booking");

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { customer, vehicle, vehicles, startDate, endDate, totalPrice } =
      req.body;

    // Normalize vehicles: accept either single 'vehicle' or array 'vehicles'
    const vehiclesArray = Array.isArray(vehicles)
      ? vehicles
      : vehicle
      ? [vehicle]
      : [];

    if (!customer || !startDate || !endDate || !totalPrice || vehiclesArray.length === 0) {
      return res.status(400).json({
        error: "Missing required fields (customer, vehicles/vehicle, startDate, endDate, totalPrice)",
      });
    }

    const booking = new Booking({
      customer,
      vehicles: vehiclesArray,
      startDate,
      endDate,
      totalPrice,
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all bookings
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customer", "name phone")
      .populate("vehicles", "licensePlate brand");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("customer", "name phone")
      .populate("vehicles", "licensePlate brand");
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update booking
exports.updateBooking = async (req, res) => {
  try {
    // Normalize vehicle(s) if client sends single 'vehicle'
    const update = { ...req.body };
    if (update.vehicle && !update.vehicles) {
      update.vehicles = [update.vehicle];
      delete update.vehicle;
    }

    const booking = await Booking.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json({ message: "Booking deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
