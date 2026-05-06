import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { userId, partnerId } = await req.json();
    
    const user = await User.findById(userId);
    const partner = await User.findById(partnerId);
    
    if (!user || !partner) return NextResponse.json({ error: 'User or Partner not found' }, { status: 404 });

    user.pendingPartners = user.pendingPartners.filter((id: any) => id.toString() !== partnerId);
    if (!user.partners.includes(partnerId)) user.partners.push(partnerId);
    if (!partner.partners.includes(userId)) partner.partners.push(userId);

    await user.save();
    await partner.save();

    const updatedUser = await User.findById(userId).populate('partners pendingPartners');
    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
