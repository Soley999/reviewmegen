import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { getUserById } from "../services/storage.js";

function getToken(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export async function requireAuth(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ message: "Missing auth token." });
    }

    const payload = jwt.verify(token, config.jwtSecret);
    const user = await getUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "Invalid auth token." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid auth token." });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) return next();

    const payload = jwt.verify(token, config.jwtSecret);
    const user = await getUserById(payload.sub);
    if (user) {
      req.user = user;
    }

    return next();
  } catch (error) {
    return next();
  }
}
