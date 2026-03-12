"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function SessionGuard() {
    const router = useRouter()

    useEffect(() => {
        // Run only on client side
        const isVerified = sessionStorage.getItem('gate_session_verified') === 'true'
        const hasCookie = document.cookie.includes('gate_access_token')

        // If we have a cookie (persisted by browser) but no sessionStorage flag (new session/tab)
        if (hasCookie && !isVerified) {
            console.log("Session verification failed. Clearing persisted access token.")

            // Clear the cookie
            document.cookie = "gate_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict"

            // Small delay to ensure cookie is cleared before reload
            setTimeout(() => {
                window.location.reload()
            }, 100)
        }
    }, [router])

    return null
}
