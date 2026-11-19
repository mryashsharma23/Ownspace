import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import lotRoutes from "./routes/lots.js";
import slotRoutes from "./routes/slots.js";
import bookingRoutes from "./routes/bookings.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();
connectDB();

const app = express();

// CLIENT_URL can hold one or more comma-separated website addresses
const allowed = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(cors({ origin: allowed }));
app.use(express.json({ limit: "1mb" })); // profile photos are sent as small base64 images

app.get("/", (req, res) => res.send("OWNSPACE API running"));
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/lots", lotRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.message);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server error" });
});

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server on port ${process.env.PORT || 5000}`),
);