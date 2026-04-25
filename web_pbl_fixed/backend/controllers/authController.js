const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ── Helper: generate JWT ───────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    {
      id:   user._id,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ── Helper: safe user object (no password) ─────────
const safeUser = (user) => ({
  _id:         user._id,
  name:        user.name,
  email:       user.email,
  phone:       user.phone,
  role:        user.role,
  // student
  studentId:   user.studentId,
  department:  user.department,
  year:        user.year,
  // faculty
  facultyId:   user.facultyId,
  designation: user.designation,
  // admin
  adminId:     user.adminId,
  bookmarks:   user.bookmarks,
  readEvents:  user.readEvents,
  createdAt:   user.createdAt,
});

// ════════════════════════════════════════════════════
//  POST /api/auth/signup
// ════════════════════════════════════════════════════
const signup = async (req, res) => {
  try {
    const {
      name, email, phone, password, role,
      // student
      studentId, department, year,
      // faculty
      facultyId, designation,
      // admin
      adminId,
    } = req.body;

    // ── Basic validation ───────────────────────────
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }

    if (!["student", "faculty", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // ── Check duplicate email ──────────────────────
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // ── Role-specific ID uniqueness check ──────────
    if (role === "student" && studentId) {
      const existing = await User.findOne({ studentId });
      if (existing) return res.status(409).json({ message: "Student ID already registered" });
    }
    if (role === "faculty" && facultyId) {
      const existing = await User.findOne({ facultyId });
      if (existing) return res.status(409).json({ message: "Faculty ID already registered" });
    }
    if (role === "admin" && adminId) {
      const existing = await User.findOne({ adminId });
      if (existing) return res.status(409).json({ message: "Admin ID already registered" });
    }

    // ── Build user object ──────────────────────────
    const userData = { name, email, phone, password, role };

    if (role === "student") {
      if (!studentId) return res.status(400).json({ message: "Student ID is required" });
      userData.studentId  = studentId;
      userData.department = department;
      userData.year       = year;
    }

    if (role === "faculty") {
      if (!facultyId) return res.status(400).json({ message: "Faculty ID is required" });
      userData.facultyId   = facultyId;
      userData.designation = designation;
      userData.department  = department;
    }

    if (role === "admin") {
      if (!adminId) return res.status(400).json({ message: "Admin ID is required" });
      userData.adminId    = adminId;
      userData.department = department;
    }

    // ── Save user (password hashed via pre-save hook) ─
    const user = await User.create(userData);

    res.status(201).json({
      message: "Signup successful",
      user: safeUser(user),
      token: generateToken(user),
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup", error: error.message });
  }
};

// ════════════════════════════════════════════════════
//  POST /api/auth/login
//  Frontend sends { id, password } where id can be
//  email, studentId, facultyId, or adminId.
// ════════════════════════════════════════════════════
const login = async (req, res) => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).json({ message: "ID and password are required" });
    }

    // ── Find user by any ID field ──────────────────
    const user = await User.findOne({
      $or: [
        { email:     id.toLowerCase() },
        { studentId: id },
        { facultyId: id },
        { adminId:   id },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ── Check password ─────────────────────────────
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      user: safeUser(user),
      token: generateToken(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
};

// ════════════════════════════════════════════════════
//  GET /api/auth/me  (protected — requires token)
// ════════════════════════════════════════════════════
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: safeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { signup, login, getMe };