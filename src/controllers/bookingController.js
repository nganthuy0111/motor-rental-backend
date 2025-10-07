const Booking = require("../models/Booking");
const { logActivity } = require("../../services/activityLogService");

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { customer, vehicle, vehicles, startDate, endDate, totalPrice } = req.body;

    const vehiclesArray = Array.isArray(vehicles) ? vehicles : vehicle ? [vehicle] : [];

    if (!customer || !startDate || !endDate || !totalPrice || vehiclesArray.length === 0) {
      await logActivity({
        ...(req.activityContext || {}),
        action: "CREATE",
        entity: "Booking",
        status: "FAIL",
        details: { reason: "Missing required fields", body: req.body },
      });
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

    await logActivity({
      ...(req.activityContext || {}),
      action: "CREATE",
      entity: "Booking",
      entityId: booking._id,
      status: "SUCCESS",
      details: { customer, vehicles: vehiclesArray, startDate, endDate, totalPrice },
    });

    res.status(201).json(booking);
  } catch (error) {
    await logActivity({
      ...(req.activityContext || {}),
      action: "CREATE",
      entity: "Booking",
      status: "FAIL",
      details: { error: error.message, body: req.body },
    });
    res.status(500).json({ error: error.message });
  }
};

// Get all bookings
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customer", "name phone")
      .populate("vehicles", "licensePlate brand");

    await logActivity({
      ...(req.activityContext || {}),
      action: "READ",
      entity: "Booking",
      status: "SUCCESS",
      details: { count: bookings.length },
    });

    res.json(bookings);
  } catch (error) {
    await logActivity({
      ...(req.activityContext || {}),
      action: "READ",
      entity: "Booking",
      status: "FAIL",
      details: { error: error.message },
    });
    res.status(500).json({ error: error.message });
  }
};

// ... trong getBookingById
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("customer", "name phone")
      .populate("vehicles", "licensePlate brand");
    if (!booking) {
      await logActivity({
        ...(req.activityContext || {}),
        action: "READ",
        entity: "Booking",
        entityId: req.params.id,
        status: "FAIL",
        details: { reason: "Not found" },
      });
      return res.status(404).json({ error: "Booking not found" });
    }

    await logActivity({
      ...(req.activityContext || {}),
      action: "READ",
      entity: "Booking",
      entityId: booking._id,
      status: "SUCCESS",
    });

    res.json(booking);
  } catch (error) {
    await logActivity({
      ...(req.activityContext || {}),
      action: "READ",
      entity: "Booking",
      entityId: req.params.id,
      status: "FAIL",
      details: { error: error.message },
    });
    res.status(500).json({ error: error.message });
  }
};

// ... trong updateBooking
exports.updateBooking = async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.vehicle && !update.vehicles) {
      update.vehicles = [update.vehicle];
      delete update.vehicle;
    }

    const booking = await Booking.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!booking) {
      await logActivity({
        ...(req.activityContext || {}),
        action: "UPDATE",
        entity: "Booking",
        entityId: req.params.id,
        status: "FAIL",
        details: { reason: "Not found", update },
      });
      return res.status(404).json({ error: "Booking not found" });
    }

    await logActivity({
      ...(req.activityContext || {}),
      action: "UPDATE",
      entity: "Booking",
      entityId: booking._id,
      status: "SUCCESS",
      details: { update },
    });

    res.json(booking);
  } catch (error) {
    await logActivity({
      ...(req.activityContext || {}),
      action: "UPDATE",
      entity: "Booking",
      entityId: req.params.id,
      status: "FAIL",
      details: { error: error.message, update: req.body },
    });
    res.status(500).json({ error: error.message });
  }
};

// ... trong deleteBooking
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      await logActivity({
        ...(req.activityContext || {}),
        action: "DELETE",
        entity: "Booking",
        entityId: req.params.id,
        status: "FAIL",
        details: { reason: "Not found" },
      });
      return res.status(404).json({ error: "Booking not found" });
    }

    await logActivity({
      ...(req.activityContext || {}),
      action: "DELETE",
      entity: "Booking",
      entityId: booking._id,
      status: "SUCCESS",
    });

    res.json({ message: "Booking deleted" });
  } catch (error) {
    await logActivity({
      ...(req.activityContext || {}),
      action: "DELETE",
      entity: "Booking",
      entityId: req.params.id,
      status: "FAIL",
      details: { error: error.message },
    });
    res.status(500).json({ error: error.message });
  }
};
