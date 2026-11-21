import mongoose from 'mongoose';

const BarberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    },
    specialty: {
      type: String,
      default: 'Senior Stylist'
    },
    isOnDuty: {
      type: Boolean,
      default: true // Barbers on duty today toggle in /admin
    },
    status: {
      type: String,
      enum: ['Available', 'Busy', 'On break'],
      default: 'Available'
    },
    currentCustomer: {
      tokenId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QueueToken',
        default: null
      },
      tokenNumber: {
        type: String,
        default: null
      },
      customerName: {
        type: String,
        default: null
      },
      services: [
        {
          type: String
        }
      ],
      startedAt: {
        type: Date,
        default: null
      },
      estimatedDuration: {
        type: Number,
        default: 0
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model('Barber', BarberSchema);
