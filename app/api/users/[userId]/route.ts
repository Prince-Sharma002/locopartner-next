import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET(req: Request, props: { params: Promise<{ userId: string }> }) {
  try {
    await connectDB();
    const params = await props.params;
    const user = await User.findById(params.userId).populate('partners pendingPartners');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
