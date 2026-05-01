import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { createUser, findUserByEmail } from "../services/storage.js";

const router = express.Router();

function issueToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, name } = req.body || {};

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, name, passwordHash });
    const token = issueToken(user);

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = issueToken(user);
    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
