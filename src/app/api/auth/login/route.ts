import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByEmail, verifyUserPassword, createSession } from '@/lib/server-user-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Пожалуйста, введите Email и пароль.' },
        { status: 400 }
      );
    }

    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Пользователь с таким Email не зарегистрирован в системе.' },
        { status: 401 }
      );
    }

    const isMatch = verifyUserPassword(user, password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Неверный пароль. Пожалуйста, проверьте введённые данные.' },
        { status: 401 }
      );
    }

    // Create session token and set HTTP-only cookie
    const token = createSession(user.id);
    const cookieStore = await cookies();
    cookieStore.set('cma_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    const { salt, passwordHash, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (error: any) {
    console.error('API Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера при входе.' },
      { status: 500 }
    );
  }
}
