import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  // 🔓 1) Public routes: skip auth for count APIs
  if (
    req.method === "GET" &&
    (req.originalUrl === "/api/events/count" ||
      req.originalUrl === "/api/services/count")
  ) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?._id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Attach user (excluding password)
    const user = await User.findById(decoded._id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export default authMiddleware;
