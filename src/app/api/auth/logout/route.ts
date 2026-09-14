import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/server-user-store';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('cma_session')?.value;
    if (token) {
      deleteSession(token);
    }
    cookieStore.delete('cma_session');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API /auth/logout error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
