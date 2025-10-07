const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema(
  {
    // ai thực hiện (nếu có xác thực, gắn từ req.user._id)
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // hành động: CREATE | READ | UPDATE | DELETE | LOGIN | LOGOUT | CUSTOM...
    action: { type: String, required: true },

    // đối tượng tác động
    entity: { type: String, required: true }, // ví dụ: "Booking"
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },

    // trạng thái kết quả
    status: { type: String, enum: ["SUCCESS", "FAIL"], default: "SUCCESS" },

    // thông tin thêm (payload, thay đổi, lỗi...)
    details: { type: Object, default: {} },

    // thông tin môi trường
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },

    // request id để trace (nếu muốn)
    requestId: { type: String, default: "" },
  },
  { timestamps: true }
);

// Index giúp truy vấn nhanh
ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ action: 1, entity: 1, createdAt: -1 });
ActivityLogSchema.index({ actor: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);