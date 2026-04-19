import Link from 'next/link'
import React from 'react'
import Image from 'next/image'
import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { SignedInView, SignedOutView } from '@/components/auth/AuthVisibility'
import { Button } from '../button'

function Header() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 px-3 sm:px-6 py-2 border-b border-border/50 bg-background/80 backdrop-blur-md h-16 overflow-x-hidden">
        <div className="max-w-6xl mx-auto flex justify-between items-center min-w-0 gap-2 sm:gap-4">
            <Link href="/" className="flex items-center gap-2">
            <Image src={"/logo.png"} alt="Logo" width={32} height={32} />
            <span className="font-bold text-base sm:text-lg">Dentify</span>
            </Link>

            <div className='hidden md:flex items-center gap-8'>
                <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
                <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
                <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</Link>

            </div>

            <div className='flex items-center gap-2 sm:gap-4 shrink-0'>
                <SignedOutView>
                    <>
                        <SignInButton mode="modal">
                            <Button variant={"ghost"} size={"sm"} className="px-2 sm:px-3 text-xs sm:text-sm">
                                Log In
                            </Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <Button size={"sm"} className="px-2 sm:px-3 text-xs sm:text-sm">
                                Sign Up
                            </Button>
                        </SignUpButton>
                    </>
                </SignedOutView>

                <SignedInView>
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/dashboard">Dashboard</Link>
                        </Button>
                        <UserButton />
                    </div>
                </SignedInView>
            </div>
        </div>

    </nav>
  )
}

export default Header