import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserBySession, updateUserProfile } from '@/lib/server-user-store';

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('cma_session')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
    }

    const currentUser = getUserBySession(token);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Сессия истекла' }, { status: 401 });
    }

    const body = await req.json();
    const updated = updateUserProfile(currentUser.id, body);

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Ошибка обновления профиля' }, { status: 400 });
    }

    const { salt, passwordHash, ...safeUser } = updated;

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (error: any) {
    console.error('API /auth/profile error:', error);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}
