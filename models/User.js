// models/User.js
import mongoose from "mongoose"; // Use ES6 import style
import bcrypt from "bcryptjs";
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    credits: {
      type: Number,
      default: 20,
      min: 0,
    },
    role: {
      // New role field
      type: String,
      enum: ["user", "admin"], // Define possible roles
      default: "user", // Default role for new registrations
    },
    isBlacklisted: {
      // New field for blacklisting
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if the model is already compiled, otherwise compile it
export default mongoose.models.User || mongoose.model("User", userSchema);
