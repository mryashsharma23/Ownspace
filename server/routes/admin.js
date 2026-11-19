import { Router } from "express";
import User from "../models/User.js";
import Lot from "../models/ParkingLot.js";
import Slot from "../models/Slot.js";
import Booking from "../models/Booking.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();
router.use(protect, adminOnly);

const myLotIds = async (adminId) =>
  (await Lot.find({ owner: adminId }).select("_id")).map((l) => l._id);

router.get("/stats", async (req, res) => {
  const lotIds = await myLotIds(req.user._id);
  const now = new Date();

  await Booking.updateMany(
    { lot: { $in: lotIds }, status: "active", endTime: { $lt: now } },
    { status: "completed" },
  );

  const [slots, bookings, customers, occupiedNow, rev] = await Promise.all([
    Slot.countDocuments({ lot: { $in: lotIds } }),
    Booking.countDocuments({ lot: { $in: lotIds } }),
    Booking.distinct("user", { lot: { $in: lotIds } }),
    Booking.countDocuments({
      lot: { $in: lotIds },
      status: "active",
      startTime: { $lte: now },
      endTime: { $gte: now },
    }),
    Booking.aggregate([
      { $match: { lot: { $in: lotIds }, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  res.json({
    lots: lotIds.length,
    slots,
    users: customers.length,
    bookings,
    occupiedNow,
    revenue: rev[0]?.total || 0,
  });
});

router.get("/bookings", async (req, res) => {
  const lotIds = await myLotIds(req.user._id);
  res.json(
    await Booking.find({ lot: { $in: lotIds } })
      .populate("user", "name email")
      .populate("lot", "name")
      .populate("slot", "number")
      .sort("-createdAt")
      .limit(100),
  );
});

router.get("/users", async (req, res) => {
  const lotIds = await myLotIds(req.user._id);
  const ids = await Booking.distinct("user", { lot: { $in: lotIds } });
  res.json(
    await User.find({ _id: { $in: ids } })
      .select("-password")
      .sort("-createdAt"),
  );
});

export default router;