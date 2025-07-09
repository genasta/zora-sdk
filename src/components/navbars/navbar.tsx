'use client';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { ModeToggle } from "@/components/buttons/toggleThemeButton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useSidebar } from "@/components/ui/sidebar"
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { WEBSITE_LOGO_PATH as LOGO_PATH, WEBSITE_NAME, WEBSITE_TITLE_FONT as WEBSITE_FONT } from "@/utils/constants/navbar-constants"
import { Palette, Sparkles, Star, Crown } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 backdrop-blur-lg border-b border-purple-500/30">
      <div className="flex h-20 items-center px-6 relative">
        {/* Logo Section with Cosmic Badge */}
        <div className="flex items-center space-x-3 relative">
          <div className="absolute -top-3 -left-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 font-black text-xs border border-purple-300 rounded-md transform rotate-3 shadow-lg">
            <Sparkles size={12} className="inline mr-1" />
            ARTCOIN
          </div>
          <Link href="/" className="flex items-center space-x-3 transform hover:scale-105 transition-transform duration-300">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur-sm opacity-75"></div>
              <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg border border-purple-400">
                <Palette size={24} className="text-white" />
              </div>
            </div>
            <span className={`text-2xl font-black uppercase ${WEBSITE_FONT} bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent transform hover:rotate-1 transition-transform duration-300`}>
              PIXELFORGE
            </span>
          </Link>
        </div>

        {/* Navigation and Actions */}
        <div className="flex flex-1 items-center justify-end gap-6">
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <Link href="/gallery" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-gradient-to-r from-purple-800/50 to-pink-800/50 px-4 py-2 text-sm font-medium text-white transition-colors hover:from-purple-700/50 hover:to-pink-700/50 border border-purple-500/30">
                  <Star size={16} className="mr-2" />
                  Gallery
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/create" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-gradient-to-r from-indigo-800/50 to-purple-800/50 px-4 py-2 text-sm font-medium text-white transition-colors hover:from-indigo-700/50 hover:to-purple-700/50 border border-indigo-500/30">
                  <Crown size={16} className="mr-2" />
                  Create
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Connect Button with Cosmic Style */}
          <div className="relative">
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 py-1 font-black text-xs border border-pink-300 rounded-md transform -rotate-12 shadow-lg">
              <Sparkles size={10} className="inline mr-1" />
              WALLET
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur-sm opacity-50"></div>
                <div className="relative">
                  <ConnectButton />
                </div>
              </div>
            </div>
          </div>

          {/* Theme Toggle with Cosmic Style */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur-sm opacity-50"></div>
            <div className="relative">
              <ModeToggle />
            </div>
          </div>
        </div>

        {/* Decorative Cosmic Elements */}
        <div className="absolute top-2 right-2 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-ping"></div>
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-3 left-20 w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
          <div className="absolute top-5 right-32 w-1 h-1 bg-pink-400 rounded-full animate-bounce delay-100"></div>
          <div className="absolute bottom-4 left-1/3 w-1 h-1 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
    </nav>
  )
}