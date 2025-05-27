// models/MoodEntry.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const moodEntrySchema = new Schema({
    user: { // Reference to the User who made this entry
        type: Schema.Types.ObjectId,
        ref: 'User', // Links to the 'User' model
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
}, {
    timestamps: true
});

moodEntrySchema.index({ user: 1, entryDate: -1 });

module.exports = mongoose.model('MoodEntry', moodEntrySchema);