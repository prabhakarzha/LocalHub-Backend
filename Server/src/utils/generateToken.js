import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role, // ✅ Add this line
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};
