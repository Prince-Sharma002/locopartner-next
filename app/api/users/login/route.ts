import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name, email } = await req.json();
    let user = await User.findOne({ email }).populate('partners pendingPartners');
    
    if (!user) {
      user = new User({ name, email });
      await user.save();
    }
    
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
