import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createUser, createSession } from '@/lib/server-user-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, company, position, role, phone } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Заполните обязательные поля: Email, Пароль и ФИО.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Пароль должен содержать не менее 6 символов.' },
        { status: 400 }
      );
    }

    const result = createUser({
      email,
      password,
      name,
      company,
      position,
      role,
      phone,
    });

    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || 'Ошибка при создании пользователя.' },
        { status: 400 }
      );
    }

    // Create session token and set HTTP-only cookie
    const token = createSession(result.user.id);
    const cookieStore = await cookies();
    cookieStore.set('cma_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    // Strip out salt and passwordHash before returning to client
    const { salt, passwordHash, ...safeUser } = result.user;

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (error: any) {
    console.error('API Register error:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера при регистрации.' },
      { status: 500 }
    );
  }
}
