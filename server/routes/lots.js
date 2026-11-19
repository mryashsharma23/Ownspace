import { Router } from "express";
import Lot from "../models/ParkingLot.js";
import Slot from "../models/Slot.js";
import Booking from "../models/Booking.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();

const inIndia = (lat, lng) => lat >= 6 && lat <= 38 && lng >= 67 && lng <= 98;

router.get("/", protect, async (req, res) => {
  const filter = req.user.role === "admin" ? { owner: req.user._id } : {};
  res.json(await Lot.find(filter).sort("-createdAt"));
});

router.get("/coverage", protect, async (req, res) => {
  res.json(
    await Lot.aggregate([
      { $match: { city: { $exists: true, $ne: "" } } },
      {
        $group: {
          _id: { city: "$city", state: "$state" },
          lots: { $sum: 1 },
          slots: { $sum: "$totalSlots" },
          lat: { $avg: "$lat" },
          lng: { $avg: "$lng" },
        },
      },
      {
        $project: {
          _id: 0,
          city: "$_id.city",
          state: "$_id.state",
          lots: 1,
          slots: 1,
          lat: 1,
          lng: 1,
        },
      },
      { $sort: { state: 1, city: 1 } },
    ]),
  );
});

router.get("/:id", protect, async (req, res) => {
  const lot = await Lot.findById(req.params.id);
  if (!lot) return res.status(404).json({ message: "Lot not found" });
  res.json(lot);
});

router.post("/", protect, adminOnly, async (req, res) => {
  const { name, location, city, state, lat, lng, totalSlots, pricePerHour } =
    req.body;
  const n = Number(totalSlots);
  const p = Number(pricePerHour);
  const la = Number(lat);
  const ln = Number(lng);

  if (!name || !location || !city?.trim() || !(n >= 1 && n <= 200) || !(p >= 0))
    return res
      .status(400)
      .json({ message: "Fill all fields (slots must be 1-200)" });
  if (!inIndia(la, ln))
    return res
      .status(400)
      .json({
        message: "Couldn't place this city on the map. Check the city name.",
      });

  const lot = await Lot.create({
    owner: req.user._id,
    name,
    location,
    city: city.trim(),
    state: (state || "").trim(),
    lat: la,
    lng: ln,
    totalSlots: n,
    pricePerHour: p,
  });
  await Slot.insertMany(
    Array.from({ length: n }, (_, i) => ({ lot: lot._id, number: i + 1 })),
  );
  res.status(201).json(lot);
});

router.put("/:id", protect, adminOnly, async (req, res) => {
  const lot = await Lot.findOne({ _id: req.params.id, owner: req.user._id });
  if (!lot) return res.status(404).json({ message: "Lot not found" });

  const { name, location, city, state, lat, lng, pricePerHour } = req.body;
  const la = Number(lat);
  const ln = Number(lng);
  if (!name || !location || !city?.trim())
    return res
      .status(400)
      .json({ message: "Name, location and city are required" });
  if (!inIndia(la, ln))
    return res
      .status(400)
      .json({
        message: "Couldn't place this city on the map. Check the city name.",
      });

  lot.name = name;
  lot.location = location;
  lot.city = city.trim();
  lot.state = (state || "").trim();
  lot.lat = la;
  lot.lng = ln;
  lot.pricePerHour = Number(pricePerHour);
  await lot.save();
  res.json(lot);
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  const lot = await Lot.findOne({ _id: req.params.id, owner: req.user._id });
  if (!lot) return res.status(404).json({ message: "Lot not found" });

  await Booking.deleteMany({ lot: lot._id });
  await Slot.deleteMany({ lot: lot._id });
  await lot.deleteOne();
  res.json({ message: "Lot deleted" });
});

export default router;