const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    vehicles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        required: true,
      },
    ],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    // Optional color to render on timelines (HEX color string like #RRGGBB)
    color: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Optimize overlap lookups by vehicle and time range
bookingSchema.index({ vehicles: 1, startDate: 1, endDate: 1, status: 1 });

// Virtual effective color: use stored color if present, otherwise default by status
function getDefaultColorByStatus(status) {
  switch (status) {
    case "pending":
      return "#9CA3AF"; // gray
    case "confirmed":
      return "#10B981"; // green
    case "cancelled":
      return "#EF4444"; // red
    case "completed":
      return "#3B82F6"; // blue
    default:
      return "#9CA3AF";
  }
}

bookingSchema.virtual("colorEffective").get(function () {
  return this.color || getDefaultColorByStatus(this.status);
});

// Include virtuals in outputs
bookingSchema.set("toJSON", { virtuals: true });
bookingSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Booking", bookingSchema);
