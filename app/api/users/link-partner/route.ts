import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { userId, partnerEmail } = await req.json();
    
    const partner = await User.findOne({ email: partnerEmail });
    if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    
    if (partner._id.toString() === userId) {
      return NextResponse.json({ error: 'Cannot link yourself' }, { status: 400 });
    }

    if (!partner.pendingPartners.includes(userId) && !partner.partners.includes(userId)) {
      partner.pendingPartners.push(userId);
      await partner.save();
    }
    
    return NextResponse.json({ message: 'Request sent to partner' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
