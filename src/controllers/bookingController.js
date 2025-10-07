const Booking = require("../models/Booking");
const { logActivity } = require("../../services/activityLogService");
const tinycolor = require("tinycolor2");

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { customer, vehicle, vehicles, startDate, endDate, totalPrice, color } = req.body;

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

    // Validate date range
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      await logActivity({
        ...(req.activityContext || {}),
        action: "CREATE",
        entity: "Booking",
        status: "FAIL",
        details: { reason: "Invalid date format", startDate, endDate },
      });
      return res.status(400).json({ error: "Invalid date format for startDate or endDate" });
    }
    if (s >= e) {
      await logActivity({
        ...(req.activityContext || {}),
        action: "CREATE",
        entity: "Booking",
        status: "FAIL",
        details: { reason: "startDate must be before endDate", startDate, endDate },
      });
      return res.status(400).json({ error: "startDate must be before endDate" });
    }

    // Validate optional color (accept CSS colors: HEX, RGB(A), HSL(A), named)
    let normalizedColor = null;
    if (typeof color === "string" && color.trim()) {
      const parsed = tinycolor(color.trim());
      if (!parsed.isValid()) {
        await logActivity({
          ...(req.activityContext || {}),
          action: "CREATE",
          entity: "Booking",
          status: "FAIL",
          details: { reason: "Invalid color format", color },
        });
        return res.status(400).json({ error: "Invalid color format. Provide a valid CSS color (HEX/RGB(A)/HSL(A)/named)" });
      }
      // Normalize to HEX or HEX8 if alpha < 1
      normalizedColor = parsed.getAlpha() < 1 ? parsed.toHex8String() : parsed.toHexString();
    }

    // Check overlap for any selected vehicle against active bookings
    const conflicting = await Booking.find({
      vehicles: { $in: vehiclesArray },
      status: { $in: ["pending", "confirmed"] },
      startDate: { $lt: e },
      endDate: { $gt: s },
    }).select("_id vehicles startDate endDate status");

    if (conflicting.length > 0) {
      await logActivity({
        ...(req.activityContext || {}),
        action: "CREATE",
        entity: "Booking",
        status: "FAIL",
        details: { reason: "Overlapping booking", vehicles: vehiclesArray, startDate: s, endDate: e, conflicts: conflicting.map(c => c._id) },
      });
      return res.status(409).json({
        error: "Vehicle(s) already booked in the selected time range",
        conflicts: conflicting,
      });
    }

    const booking = new Booking({
      customer,
      vehicles: vehiclesArray,
      startDate,
      endDate,
      totalPrice,
      color: normalizedColor,
    });

    await booking.save();

    await logActivity({
      ...(req.activityContext || {}),
      action: "CREATE",
      entity: "Booking",
      entityId: booking._id,
      status: "SUCCESS",
      details: { customer, vehicles: vehiclesArray, startDate, endDate, totalPrice, color: booking.color },
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
    const current = await Booking.findById(req.params.id);
    if (!current) {
      await logActivity({
        ...(req.activityContext || {}),
        action: "UPDATE",
        entity: "Booking",
        entityId: req.params.id,
        status: "FAIL",
        details: { reason: "Not found", update: req.body },
      });
      return res.status(404).json({ error: "Booking not found" });
    }

    const update = { ...req.body };
    // Normalize vehicles input
    let vehiclesArray = Array.isArray(update.vehicles)
      ? update.vehicles
      : update.vehicle
      ? [update.vehicle]
      : current.vehicles.map(v => v.toString());
    if (update.vehicle) delete update.vehicle;

    // Determine proposed dates
    const s = update.startDate ? new Date(update.startDate) : new Date(current.startDate);
    const e = update.endDate ? new Date(update.endDate) : new Date(current.endDate);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      await logActivity({
        ...(req.activityContext || {}),
        action: "UPDATE",
        entity: "Booking",
        entityId: current._id,
        status: "FAIL",
        details: { reason: "Invalid date format", update: req.body },
      });
      return res.status(400).json({ error: "Invalid date format for startDate or endDate" });
    }
    if (s >= e) {
      await logActivity({
        ...(req.activityContext || {}),
        action: "UPDATE",
        entity: "Booking",
        entityId: current._id,
        status: "FAIL",
        details: { reason: "startDate must be before endDate", startDate: s, endDate: e },
      });
      return res.status(400).json({ error: "startDate must be before endDate" });
    }

    if (!vehiclesArray || vehiclesArray.length === 0) {
      await logActivity({
        ...(req.activityContext || {}),
        action: "UPDATE",
        entity: "Booking",
        entityId: current._id,
        status: "FAIL",
        details: { reason: "No vehicles provided" },
      });
      return res.status(400).json({ error: "At least one vehicle is required" });
    }

    // Validate optional color on update when provided (accept full CSS color space)
    if (Object.prototype.hasOwnProperty.call(update, "color")) {
      const incoming = typeof update.color === "string" ? update.color.trim() : "";
      if (!incoming) {
        update.color = null; // allow clearing color
      } else {
        const parsedU = tinycolor(incoming);
        if (!parsedU.isValid()) {
          await logActivity({
            ...(req.activityContext || {}),
            action: "UPDATE",
            entity: "Booking",
            entityId: current._id,
            status: "FAIL",
            details: { reason: "Invalid color format", color: update.color },
          });
          return res.status(400).json({ error: "Invalid color format. Provide a valid CSS color (HEX/RGB(A)/HSL(A)/named)" });
        }
        update.color = parsedU.getAlpha() < 1 ? parsedU.toHex8String() : parsedU.toHexString();
      }
    }

    // Overlap check excluding current booking
    const conflicting = await Booking.find({
      _id: { $ne: current._id },
      vehicles: { $in: vehiclesArray },
      status: { $in: ["pending", "confirmed"] },
      startDate: { $lt: e },
      endDate: { $gt: s },
    }).select("_id vehicles startDate endDate status");

    if (conflicting.length > 0) {
      await logActivity({
        ...(req.activityContext || {}),
        action: "UPDATE",
        entity: "Booking",
        entityId: current._id,
        status: "FAIL",
        details: { reason: "Overlapping booking", vehicles: vehiclesArray, startDate: s, endDate: e, conflicts: conflicting.map(c => c._id) },
      });
      return res.status(409).json({
        error: "Vehicle(s) already booked in the selected time range",
        conflicts: conflicting,
      });
    }

    const updated = await Booking.findByIdAndUpdate(
      current._id,
      { ...update, vehicles: vehiclesArray, startDate: s, endDate: e },
      { new: true }
    );

    await logActivity({
      ...(req.activityContext || {}),
      action: "UPDATE",
      entity: "Booking",
      entityId: updated._id,
      status: "SUCCESS",
      details: { update: { ...update, vehicles: vehiclesArray, startDate: s, endDate: e } },
    });

    res.json(updated);
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
