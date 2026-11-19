import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = Router();

const sign = (u) =>
  jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
const out = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  photo: u.photo,
  role: u.role,
  token: sign(u),
});

router.post("/register", async (req, res) => {
  const { name, email, password, phone, adminCode } = req.body;
  if (!name || !email || !password)
    return res
      .status(400)
      .json({ message: "Name, email and password are required" });
  if (password.length < 6)
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  if (await User.findOne({ email: email.toLowerCase() }))
    return res.status(400).json({ message: "Email already registered" });

  let role = "user";
  if (adminCode) {
    if (adminCode !== process.env.ADMIN_CODE)
      return res.status(400).json({ message: "Invalid admin code" });
    role = "admin";
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashed,
    phone,
    role,
  });
  res.status(201).json(out(user));
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user || !(await bcrypt.compare(password || "", user.password)))
    return res.status(401).json({ message: "Invalid email or password" });
  res.json(out(user));
});

router.get("/me", protect, (req, res) => res.json(req.user));

export default router;