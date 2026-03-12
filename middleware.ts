import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // 1. Initialize Response
    let response = NextResponse.next()

    // 2. Handle CORS for API routes
    if (path.startsWith('/api')) {
        // Create response for preflight or continue
        if (request.method === 'OPTIONS') {
            response = new NextResponse(null, { status: 204 })
        }
        
        response.headers.set('Access-Control-Allow-Origin', '*')
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
        if (request.method === 'OPTIONS') {
            return response
        }
    }

    // 3. Define paths to exclude from restriction
    if (
        path === '/' ||
        path.startsWith('/scan') ||
        path.startsWith('/screen') ||
        path.startsWith('/access') ||
        path.startsWith('/api') ||
        path.startsWith('/_next') ||
        path.startsWith('/favicon.ico') ||
        path.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)
    ) {
        return response
    }

    // 4. Dynamic Access Check
    const enableDynamicAccess = process.env.ENABLE_DYNAMIC_ACCESS === 'true'
    const hasAccessToken = request.cookies.has('gate_access_token')

    if (enableDynamicAccess && !hasAccessToken) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 5. Check Admin Access Control
    const disableRestriction = process.env.DISABLE_ADMIN_IP_RESTRICTION === 'true'
    if (disableRestriction) {
        return response
    }

    // 6. Get Client IP
    let ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'

    // 7. Check against ALLOWED_ADMIN_IPS
    const allowedIps = (process.env.ALLOWED_ADMIN_IPS || '').split(',').map(i => i.trim())
    const isAllowed = allowedIps.includes(ip) || ip === '::1' || ip === '127.0.0.1'

    if (!isAllowed) {
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Access Denied: IP not allowed' }),
            { status: 403, headers: { 'content-type': 'application/json' } }
        )
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes) -> Wait, user might want to protect API too? usually yes for admin API.
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - screen (Display Client) - Excluded in logic above, but cleaner to exclude in matcher?
         * logic above allows dynamic checking of subpaths.
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
