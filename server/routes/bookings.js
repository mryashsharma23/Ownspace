import { Router } from "express";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Slot from "../models/Slot.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Public: opened when a ticket's QR code is scanned
router.get("/verify/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ message: "Ticket not found" });

  const b = await Booking.findById(req.params.id)
    .populate("user", "name")
    .populate("lot", "name location city")
    .populate("slot", "number");
  if (!b) return res.status(404).json({ message: "Ticket not found" });

  const now = new Date();
  let result = "valid";
  if (b.status === "cancelled") result = "cancelled";
  else if (b.status === "completed" || now > b.endTime) result = "expired";
  else if (now < b.startTime) result = "upcoming";

  res.json({
    result,
    vehicleNumber: b.vehicleNumber,
    driver: b.user?.name?.split(" ")[0] || "",
    lot: b.lot
      ? { name: b.lot.name, location: b.lot.location, city: b.lot.city }
      : null,
    slot: b.slot?.number,
    startTime: b.startTime,
    endTime: b.endTime,
  });
});

router.post("/", protect, async (req, res) => {
  const { slotId, vehicleNumber, startTime, endTime } = req.body;
  const s = new Date(startTime);
  const e = new Date(endTime);

  if (!slotId || !vehicleNumber || isNaN(s) || isNaN(e))
    return res.status(400).json({ message: "All fields are required" });
  if (e <= s)
    return res
      .status(400)
      .json({ message: "End time must be after start time" });
  if (s < new Date(Date.now() - 60000))
    return res
      .status(400)
      .json({ message: "Start time cannot be in the past" });

  const slot = await Slot.findById(slotId).populate("lot");
  if (!slot) return res.status(404).json({ message: "Slot not found" });

  const clash = await Booking.findOne({
    slot: slotId,
    status: "active",
    startTime: { $lt: e },
    endTime: { $gt: s },
  });
  if (clash)
    return res
      .status(409)
      .json({ message: "Slot already booked for this time" });

  const hours = Math.ceil((e - s) / 36e5);
  const amount = hours * slot.lot.pricePerHour;

  const booking = await Booking.create({
    user: req.user._id,
    lot: slot.lot._id,
    slot: slot._id,
    vehicleNumber: vehicleNumber.trim().toUpperCase(),
    startTime: s,
    endTime: e,
    amount,
  });
  res.status(201).json(booking);
});

router.get("/my", protect, async (req, res) => {
  await Booking.updateMany(
    { user: req.user._id, status: "active", endTime: { $lt: new Date() } },
    { status: "completed" },
  );
  const list = await Booking.find({ user: req.user._id })
    .populate("lot", "name location")
    .populate("slot", "number")
    .sort("-createdAt");
  res.json(list);
});

router.put("/:id/cancel", protect, async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, user: req.user._id });
  if (!b) return res.status(404).json({ message: "Booking not found" });
  if (b.status !== "active")
    return res
      .status(400)
      .json({ message: "Only active bookings can be cancelled" });
  b.status = "cancelled";
  await b.save();
  res.json(b);
});

export default router;