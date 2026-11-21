import mongoose from 'mongoose';

const SalonConfigSchema = new mongoose.Schema(
  {
    salonName: {
      type: String,
      default: 'Branja Barber Studio'
    },
    tagline: {
      type: String,
      default: 'Your style, effortlessly. Find your barber. Book your next fresh look.'
    },
    openingTime: {
      type: String,
      default: '09:00'
    },
    closingTime: {
      type: String,
      default: '21:00' // 9:00 PM
    },
    onlineJoiningCutoffMinutes: {
      type: Number,
      default: 30 // closes 30 mins before closing time -> 8:30 PM
    },
    isMasterQueueOpen: {
      type: Boolean,
      default: true // Owner's Open / Closed switch in /admin
    },
    staffPin: {
      type: String,
      default: '1234'
    },
    bannerImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80'
    },
    logo: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export default mongoose.model('SalonConfig', SalonConfigSchema);
