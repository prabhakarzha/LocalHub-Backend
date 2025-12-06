import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  // Debug dekhne ke liye (1–2 run ke liye rakh sakta hai)
  console.log("Auth hit:", req.method, req.originalUrl);

  // 🔓 PUBLIC ROUTES: skip auth for count APIs (flexible match)
  const publicCountPaths = ["/api/events/count", "/api/services/count"];

  if (
    req.method === "GET" &&
    publicCountPaths.some((p) => req.originalUrl.startsWith(p))
  ) {
    console.log("Skipping auth for public route:", req.originalUrl);
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?._id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

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
