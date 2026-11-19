import mongoose from "mongoose";

const lotSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    totalSlots: { type: Number, required: true, min: 1 },
    pricePerHour: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("ParkingLot", lotSchema);