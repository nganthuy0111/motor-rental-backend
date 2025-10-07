const express = require("express");
const ActivityLog = require("../models/ActivityLog");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ActivityLogs
 *   description: Activity log queries and auditing
 */

/**
 * @swagger
 * /api/activity-logs:
 *   get:
 *     summary: Query activity logs
 *     description: Filterable list of activity logs.
 *     tags: [ActivityLogs]
 *     parameters:
 *       - in: query
 *         name: actor
 *         schema:
 *           type: string
 *         description: User ID of the actor
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           example: CREATE
 *         description: Action type
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *           example: Booking
 *         description: Affected entity name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SUCCESS, FAIL]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start datetime (ISO)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End datetime (ISO)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated activity logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       actor:
 *                         nullable: true
 *                         oneOf:
 *                           - type: string
 *                           - type: object
 *                       action:
 *                         type: string
 *                       entity:
 *                         type: string
 *                       entityId:
 *                         nullable: true
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [SUCCESS, FAIL]
 *                       details:
 *                         type: object
 *                       ip:
 *                         type: string
 *                       userAgent:
 *                         type: string
 *                       requestId:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 */
// GET /api/activity-logs?actor=<id>&action=CREATE&entity=Booking&status=SUCCESS&page=1&limit=20
router.get("/", async (req, res) => {
  try {
    const {
      actor,
      action,
      entity,
      status,
      from, // ISO date
      to,   // ISO date
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (actor) filter.actor = actor;
    if (action) filter.action = action;
    if (entity) filter.entity = entity;
    if (status) filter.status = status;

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("actor", "name email"), // tùy schema User
      ActivityLog.countDocuments(filter),
    ]);

    res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      items,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;