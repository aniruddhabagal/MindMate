// models/JournalEntry.js
import mongoose from "mongoose"; // Use ES6 import style
const Schema = mongoose.Schema;

const journalEntrySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: "Untitled Entry",
      maxlength: 150,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    entryDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    associatedMood: {
      type: String,
      enum: ["happy", "sad", "anxious", "calm", "stressed", ""], // Allow empty
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

journalEntrySchema.index({ user: 1, entryDate: -1 });

// Check if the model is already compiled, otherwise compile it
export default mongoose.models.JournalEntry ||
  mongoose.model("JournalEntry", journalEntrySchema);
