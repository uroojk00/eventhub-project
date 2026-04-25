const mongoose = require("mongoose");

// ── Sub-schema: dynamic registration form field ────
const FormFieldSchema = new mongoose.Schema(
  {
    fieldName: { type: String, required: true }, // key sent in POST (e.g. "studentId")
    label:     { type: String, required: true }, // display label  (e.g. "Student ID")
    type:      { type: String, default: "text", enum: ["text", "email", "number", "tel"] },
    required:  { type: Boolean, default: false },
  },
  { _id: false }
);

// ── Sub-schema: a single registration entry ────────
const RegistrationSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    formData:  { type: Map, of: String }, // dynamic key-value pairs submitted by user
    registeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ── Main Event Schema ──────────────────────────────
const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    image: {
      type: String, // stored as filename/path under /uploads/
      default: null,
    },

    // Who created this event
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Registration configuration
    requiresRegistration: {
      type: Boolean,
      default: false,
    },
    formFields: [FormFieldSchema], // dynamic form definition

    // Actual registrations
    registrations: [RegistrationSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", EventSchema);