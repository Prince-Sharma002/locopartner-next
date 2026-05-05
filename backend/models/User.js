const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  partners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingPartners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  mood: {
    type: String,
    enum: ['Busy', 'Free', 'Not feeling good', 'None'],
    default: 'None'
  },
  settings: {
    isSharingPaused: { type: Boolean, default: false },
    isInvisible: { type: Boolean, default: false },
    visibilityType: {
      type: String,
      enum: ['Exact', 'Approximate', 'Off'],
      default: 'Exact'
    },
    trackingRadius: { type: Number, default: 5 }
  },
  lastUpdated: { type: Date, default: Date.now }
});

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
