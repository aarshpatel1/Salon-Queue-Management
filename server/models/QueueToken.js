import mongoose from 'mongoose';

const QueueTokenSchema = new mongoose.Schema(
  {
    tokenNumber: {
      type: String,
      required: true,
      index: true
    },
    tokenSequence: {
      type: Number,
      required: true,
      index: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    avatar: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    services: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Service'
        },
        name: String,
        duration: Number, // in minutes
        price: Number     // in INR (₹)
      }
    ],
    totalDuration: {
      type: Number,
      required: true,
      default: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0
    },
    preferredBarber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barber',
      default: null // null indicates 'Any barber (fastest)'
    },
    preferredBarberName: {
      type: String,
      default: 'Any barber (fastest)'
    },
    assignedBarber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barber',
      default: null
    },
    assignedBarberName: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['Waiting', 'Called', 'In chair', 'Done', 'Cancelled', 'No-show'],
      default: 'Waiting',
      index: true
    },
    isWalkIn: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    calledAt: {
      type: Date,
      default: null
    },
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    noShowAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model('QueueToken', QueueTokenSchema);
