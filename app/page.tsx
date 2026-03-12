"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import dynamic from 'next/dynamic'

// Dynamically import the GSAP Shuffle component to prevent SSR hydration mismatches
const Shuffle = dynamic(() => import('@/components/ui/shuffle-text'), {
  ssr: false,
  loading: () => <div className="text-2xl md:text-3xl font-bold tracking-[0.3em] font-mono text-transparent">C E 0 3  T E A M</div>
})

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if dynamic access is enabled and if the token is present
    const hasAccessToken = document.cookie.includes('gate_access_token')

    // Redirect to dashboard after 5 seconds ONLY if they have access
    const timer = setTimeout(() => {
      if (hasAccessToken) {
        router.push('/dashboard')
      } else {
        console.log("Blocking auto-redirect: Access token missing")
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Optional faint background grid for modern feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <div className="z-10 flex flex-col items-center justify-center space-y-8">

        {/* Logo Image */}
        <div className="relative w-80 h-80 md:w-[450px] md:h-[450px] drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] animate-in fade-in zoom-in duration-1000">
          <Image
            src="/CPE.webp"
            alt="CPE Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="h-8 flex items-center justify-center -top-8 relative animate-in fade-in duration-1000 delay-500 z-50">
          <Shuffle
            text="C E 0 3  T E A M"
            className="text-2xl md:text-3xl font-bold tracking-[0.3em] text-orange-400 drop-shadow-[0_0_10px_rgba(255,165,0,0.8)] font-mono"
            shuffleDirection="right"
            duration={0.35}
            shuffleTimes={15}
            loop={true}
            loopDelay={3}
          />
        </div>

        {/* Loading Animation */}
        <div className="flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-both">
          <div className="text-xl font-medium tracking-widest text-zinc-300 uppercase">
            Loading System
          </div>

          {/* Bouncing Dots */}
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
          </div>
        </div>

      </div>

      {/* Footer Text */}
      <footer className="absolute bottom-8 text-zinc-600 font-mono text-xs tracking-wider animate-in fade-in duration-1000 delay-500 fill-mode-both">
        BoothMachine Config System
      </footer>
    </div>
  )
}
