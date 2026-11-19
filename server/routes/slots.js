import { Router } from "express";
import Slot from "../models/Slot.js";
import Booking from "../models/Booking.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/:lotId", protect, async (req, res) => {
  const slots = await Slot.find({ lot: req.params.lotId }).sort("number");
  const { start, end } = req.query;
  let busy = new Set();

  if (start && end) {
    const bookings = await Booking.find({
      lot: req.params.lotId,
      status: "active",
      startTime: { $lt: new Date(end) },
      endTime: { $gt: new Date(start) },
    }).select("slot");
    busy = new Set(bookings.map((b) => String(b.slot)));
  }

  res.json(
    slots.map((s) => ({
      _id: s._id,
      number: s.number,
      available: !busy.has(String(s._id)),
    })),
  );
});

export default router;