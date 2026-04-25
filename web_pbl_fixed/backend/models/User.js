const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    // ── Common Fields ──────────────────────────────
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["student", "faculty", "admin"],
      required: true,
    },

    // ── Student-specific Fields ────────────────────
    studentId: { type: String, sparse: true, trim: true },
    department: { type: String, trim: true },
    year: { type: String },

    // ── Faculty-specific Fields ────────────────────
    facultyId: { type: String, sparse: true, trim: true },
    designation: { type: String, trim: true },

    // ── Admin-specific Fields ──────────────────────
    adminId: { type: String, sparse: true, trim: true },

    // ── Profile Fields (FIXED ✅) ──────────────────
    bio: { type: String, trim: true },
    avatar: { type: String },
    semester: { type: String },
    section: { type: String, trim: true },
    interests: [{ type: String }],
    clubsJoined: [{ type: String }],

    // Faculty extras
    facultyDepartment: { type: String, trim: true },
    officeLocation: { type: String, trim: true },
    subjectsHandled: [{ type: String }],
    clubsManaged: [{ clubName: String, role: String }],

    // Admin extras
    adminDepartment: { type: String, trim: true },

    // Notifications
    notifPrefs: {
      assignments: { type: Boolean, default: true },
      exams: { type: Boolean, default: true },
      notices: { type: Boolean, default: true },
      clubs: { type: Boolean, default: false },
      workshops: { type: Boolean, default: false },
    },

    // Activity Tracking
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    readEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  },
  {
    timestamps: true,
  }
);

// ── Hash password before saving ────────────────────
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Method to compare password ─────────────────────
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);