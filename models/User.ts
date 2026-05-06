import mongoose, { Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  partners: mongoose.Types.ObjectId[];
  pendingPartners: mongoose.Types.ObjectId[];
  location: {
    type: string;
    coordinates: number[];
  };
  mood: string;
  settings: {
    isSharingPaused: boolean;
    isInvisible: boolean;
    visibilityType: 'Exact' | 'Approximate' | 'Off';
    trackingRadius: number;
  };
  lastUpdated: Date;
}

const userSchema = new mongoose.Schema<IUser>({
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

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
