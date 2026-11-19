import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = Router();

const pub = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  photo: u.photo,
  role: u.role,
});

router.get("/", protect, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json(pub(user));
});

router.put("/", protect, async (req, res) => {
  const { name, email, phone, photo } = req.body;
  const user = await User.findById(req.user._id);

  if (name !== undefined) {
    if (!name.trim())
      return res.status(400).json({ message: "Name can't be empty" });
    user.name = name.trim();
  }

  if (email !== undefined) {
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e))
      return res.status(400).json({ message: "Enter a valid email" });
    if (e !== user.email && (await User.findOne({ email: e })))
      return res.status(400).json({ message: "That email is already in use" });
    user.email = e;
  }

  if (phone !== undefined) {
    const p = phone.trim();
    if (p && !/^\+?[0-9\s-]{7,15}$/.test(p))
      return res.status(400).json({ message: "Enter a valid phone number" });
    user.phone = p;
  }

  if (photo !== undefined) {
    const ph = photo || "";
    if (ph && !/^data:image\/(jpeg|png|webp);base64,/.test(ph))
      return res
        .status(400)
        .json({ message: "Photo must be a JPG, PNG or WebP image" });
    if (ph.length > 400000)
      return res.status(400).json({ message: "Photo is too large" });
    user.photo = ph;
  }

  await user.save();
  res.json(pub(user));
});

router.put("/password", protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "Fill in both passwords" });
  if (newPassword.length < 6)
    return res
      .status(400)
      .json({ message: "New password must be at least 6 characters" });

  const user = await User.findById(req.user._id);
  if (!(await bcrypt.compare(currentPassword, user.password)))
    return res.status(400).json({ message: "Current password is wrong" });

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: "Password updated" });
});

export default router;