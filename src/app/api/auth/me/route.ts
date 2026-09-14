import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserBySession } from '@/lib/server-user-store';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('cma_session')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = getUserBySession(token);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const { salt, passwordHash, ...safeUser } = user;

    return NextResponse.json({
      authenticated: true,
      user: safeUser,
    });
  } catch (error: any) {
    console.error('API /auth/me error:', error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
