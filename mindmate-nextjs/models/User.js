// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // For hashing passwords
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: {
      // Or email, depending on your preference for login
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true, // Optional: store usernames in lowercase
      index: true,
    },
    credits: {
      type: Number,
      default: 20, // Grant 10 free credits on registration
      min: 0, // Credits cannot go below 0
    },
    // You could also use email as the primary identifier for login
    // email: {
    //     type: String,
    //     required: [true, 'Email is required'],
    //     unique: true,
    //     trim: true,
    //     lowercase: true,
    //     match: [/\S+@\S+\.\S+/, 'Please use a valid email address.'], // Basic email validation
    //     index: true,
    // },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"], // Basic password length
      // Do NOT select the password by default when querying users
      // select: false, // We'll handle this more explicitly in queries where needed
    },
    // You can keep fields like dailyStreak if you wish
    dailyStreak: { type: Number, default: 0 },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  }
);

// --- Mongoose Middleware (Hooks) ---

// Hash password before saving a new user or when password is modified
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10); // Generate a salt
    this.password = await bcrypt.hash(this.password, salt); // Hash the password
    next();
  } catch (error) {
    next(error); // Pass error to the next middleware
  }
});

// --- Mongoose Instance Methods ---

// Method to compare entered password with the hashed password in the database
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
