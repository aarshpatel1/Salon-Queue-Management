import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: Number, // in minutes
      required: true,
      min: 5
    },
    price: {
      type: Number, // in INR (₹)
      required: true,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    category: {
      type: String,
      default: 'General'
    },
    icon: {
      type: String,
      default: 'scissors'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Service', ServiceSchema);
