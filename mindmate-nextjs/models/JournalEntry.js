// models/JournalEntry.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const journalEntrySchema = new Schema({
    user: { // Reference to the User who wrote this entry
        type: Schema.Types.ObjectId,
        ref: 'User', // Links to the 'User' model
        required: true,
        index: true,
    },
    title: {
        type: String,
        trim: true,
        default: 'Untitled Entry', // Matches your frontend journal form behavior
        maxlength: 150,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    entryDate: { // The specific date and time this journal entry was made
        type: Date,
        default: Date.now,
        required: true,
    },
    // Optional: to associate a mood with this journal entry,
    // e.g., if the user journals about why they feel a certain way.
    associatedMood: {
        type: String,
        enum: ["happy", "sad", "anxious", "calm", "stressed", ""], // Allow empty if not specified
        default: "",
    }
}, {
    timestamps: true // Automatically adds `createdAt` and `updatedAt`
});

// To efficiently query journal entries by user and date
journalEntrySchema.index({ user: 1, entryDate: -1 });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);