import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createServiceBooking,
  getUserServiceBookings,
  cancelServiceBooking,
} from "../controllers/serviceBookingController.js";

const router = express.Router();

router.post("/", authMiddleware, createServiceBooking);

router.get("/", getUserServiceBookings);

router.delete("/:id", authMiddleware, cancelServiceBooking);

export default router;
