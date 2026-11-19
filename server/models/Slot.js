import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  lot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ParkingLot",
    required: true,
  },
  number: { type: Number, required: true },
});

export default mongoose.model("Slot", slotSchema);