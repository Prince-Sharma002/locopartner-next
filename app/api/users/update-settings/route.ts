import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { userId, settings } = await req.json();
    
    const user = await User.findByIdAndUpdate(userId, { settings }, { new: true });
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
