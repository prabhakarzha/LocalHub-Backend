import Event from "../models/Event.js";
import cloudinary from "../utils/cloudinary.js";

/* ---------------- CREATE EVENT ---------------- */
export const createEvent = async (req, res) => {
  try {
    console.log("Incoming Event Data:", req.body);
    console.log("Uploaded File (Multer):", req.file);

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "localhub/events",
      transformation: [
        { width: 400, height: 250, crop: "fill", gravity: "auto" },
      ],
      allowed_formats: ["jpg", "jpeg", "png"],
    });

    const transformedUrl = result.secure_url.replace(
      "/upload/",
      "/upload/w_400,h_250,c_fill,g_auto/"
    );

    const createdBy = req.user?._id || null;
    const userRole = req.user?.role || "user";
    const eventStatus = userRole === "admin" ? "approved" : "pending";

    const event = await Event.create({
      ...req.body,
      image: transformedUrl,
      createdBy,
      status: eventStatus,
    });

    res.status(201).json({
      success: true,
      message:
        userRole === "admin"
          ? "Event created successfully and approved automatically."
          : "Event created successfully. Waiting for admin approval.",
      event,
    });
  } catch (error) {
    console.error("Event creation failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create event. " + error.message,
    });
  }
};

/* ---------------- GET ALL EVENTS (ADMIN) ---------------- */
// ✅ Get all events (with pagination)
export const getAllEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; // 👈 Default 6 per page
    const skip = (page - 1) * limit;

    // Get total count (for pagination info)
    const totalEvents = await Event.countDocuments();

    // Fetch paginated events
    const events = await Event.find()
      .populate("createdBy", "name username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      page,
      totalPages: Math.ceil(totalEvents / limit),
      totalEvents,
      events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* ---------------- GET APPROVED EVENTS ---------------- */
export const getApprovedEvents = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const total = await Event.countDocuments({ status: "approved" });
    const events = await Event.find({ status: "approved" })
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email role");

    res.status(200).json({
      success: true,
      events,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching approved events:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ---------------- GET USER EVENTS ---------------- */
export const getUserEvents = async (req, res) => {
  try {
    const userId = req.user?._id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const total = await Event.countDocuments({ createdBy: userId });
    const events = await Event.find({ createdBy: userId })
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email role");

    res.status(200).json({
      success: true,
      events,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user events:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ---------------- UPDATE EVENT STATUS (ADMIN) ---------------- */
export const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "declined"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const event = await Event.findByIdAndUpdate(id, { status }, { new: true });

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    res.status(200).json({
      success: true,
      message: `Event ${status} successfully.`,
      event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ---------------- UPDATE EVENT ---------------- */
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ---------------- DELETE EVENT ---------------- */
export const deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Event deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ---------------- GET EVENT COUNT ---------------- */
export const getEventCount = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    res.status(200).json({ totalEvents });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------- GET PENDING EVENTS (ADMIN) ---------------- */
export const getPendingEvents = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const total = await Event.countDocuments({ status: "pending" });
    const pendingEvents = await Event.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email role");

    res.status(200).json({
      success: true,
      events: pendingEvents,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching pending events:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
