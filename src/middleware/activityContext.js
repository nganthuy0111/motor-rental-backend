function activityContext(req, res, next) {
    // nếu bạn có auth, gắn req.user = { _id, ... } tại middleware xác thực
    const actor = req.user?._id || null;
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";
    const userAgent = req.headers["user-agent"] || "";
    const requestId =
      req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
    req.activityContext = { actor, ip, userAgent, requestId };
    next();
  }
  module.exports = { activityContext };
