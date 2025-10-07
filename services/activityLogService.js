const ActivityLog = require("../src/models/ActivityLog");

async function logActivity({
  actor = null,
  action,
  entity,
  entityId = null,
  status = "SUCCESS",
  details = {},
  ip = "",
  userAgent = "",
  requestId = "",
}) {
  try {
    await ActivityLog.create({
      actor,
      action,
      entity,
      entityId,
      status,
      details,
      ip,
      userAgent,
      requestId,
    });
  } catch (e) {
    // tránh throw để không làm hỏng luồng chính
    console.error("[ActivityLog] failed:", e?.message || e);
  }
}

module.exports = { logActivity };