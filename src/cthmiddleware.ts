import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const publicRoutes = [
    '/signin',
    '/menus',
    '/support', 
    '/support/[slug]',
    '/auth/sso',
];

const rolePermissions: Record<string, string[]> = {
    '1': [
        '/dashboard',
        '/rooms',
        '/users',
        '/manage-booking',
        '/profile',
        '/admin-panel',
        '/orders',
        '/vehicles',
    ],
    '2': [
        '/manage-booking',
        '/profile',
        '/orders',
        '/vehicles',
    ],
    '3': [
        '/support',
        '/manage-booking/my-bookings',
        '/manage-booking/create-booking',
        '/profile',
        '/orders/my-orders',
        '/orders/create',
        '/orders/edit',
        '/vehicles/my-assignments',
        '/vehicles/my-requests',
        '/vehicles/create',
        '/vehicles/edit',
        '/vehicles/schedule',
    ],
    
};

const homeRoutes: Record<string, string> = {
    '1': '/menus',
    '2': '/menus',
    '3': '/menus',

};

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('Variabel lingkungan JWT_SECRET tidak diatur');
    }
    return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const tokenCookie = request.cookies.get('cookieKey');
    const token = tokenCookie?.value;
    const role = request.cookies.get('role')?.value;

    // 1. Cek Token
    if (!token) {
        if (!publicRoutes.includes(pathname)) {
            return NextResponse.redirect(new URL('/signin', request.url));
        }
        return NextResponse.next();
    }

    const userRole = String(role || ''); 
    const userHomeRoute = homeRoutes[userRole] || '/signin';

    // 2. Redirect Login/Root ke Home
    if (pathname === '/signin' || pathname === '/') {
        return NextResponse.redirect(new URL(userHomeRoute, request.url));
    }

    // 3. Allow Access to Menus (PENTING)
    // Pastikan request ke /menus selalu lolos jika sudah punya token
    if (pathname.startsWith('/menus')) {
        return NextResponse.next();
    }

    // 4. Cek Permission Role
    if (!publicRoutes.includes(pathname)) {
        const allowedRoutes = rolePermissions[userRole] || [];
        const isAuthorized = allowedRoutes.some(route => pathname.startsWith(route));
        
        if (isAuthorized) {
            return NextResponse.next();
        } else {
            if (pathname === userHomeRoute) {
                 return NextResponse.next(); 
            }
            return NextResponse.redirect(new URL(userHomeRoute, request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/((?!api|_next/static|_next/image|images|favicon.ico|.*\\..*).*)',
};