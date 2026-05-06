import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export async function POST(req: Request) {
  try {
    await connectDB();
    const { userId, latitude, longitude, mood } = await req.json();

    const user = await User.findById(userId).populate('partners');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Update user's location and mood
    if (latitude && longitude) {
      if (!user.location) user.location = { type: 'Point', coordinates: [0, 0] };
      user.location.coordinates = [longitude, latitude];
    }
    if (mood) {
      user.mood = mood;
    }
    user.lastUpdated = new Date();
    await user.save();

    // Prepare partner data to return
    const partnerUpdates: any[] = [];

    if (user.partners && user.partners.length > 0) {
      user.partners.forEach((partner: any) => {
        // Skip if partner paused sharing or is invisible
        if (partner.settings?.isSharingPaused || partner.settings?.isInvisible) {
          return; // omit them from the update payload
        }

        let distance = null;
        if (latitude && longitude && partner.location?.coordinates) {
          distance = getDistance(
            latitude, longitude,
            partner.location.coordinates[1], partner.location.coordinates[0]
          );
        }

        partnerUpdates.push({
          _id: partner._id,
          name: partner.name,
          latitude: partner.location.coordinates[1],
          longitude: partner.location.coordinates[0],
          distance,
          mood: partner.mood,
          visibilityType: partner.settings?.visibilityType || 'Exact'
        });
      });
    }

    return NextResponse.json({ partners: partnerUpdates });
  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
