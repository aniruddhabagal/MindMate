// models/MoodEntry.js
import mongoose from "mongoose"; // Use ES6 import style
const Schema = mongoose.Schema;

const moodEntrySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mood: {
      type: String,
      required: true,
      enum: ["happy", "sad", "anxious", "calm", "stressed"],
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    entryDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

moodEntrySchema.index({ user: 1, entryDate: -1 });

// Check if the model is already compiled, otherwise compile it
export default mongoose.models.MoodEntry ||
  mongoose.model("MoodEntry", moodEntrySchema);
