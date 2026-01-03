// src/components/admin/simple-header.tsx - EXACT WORKING VERSION
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Settings,
  LogOut,
  Activity,
  ChevronDown,
  Cpu
} from 'lucide-react'
import { signOut } from 'next-auth/react'

interface HeaderWithMenuProps {
  session: {
    user?: {
      name?: string
      email?: string
    }
  }
}

export function SimpleHeader({ session }: HeaderWithMenuProps) {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Toggle menu
  const toggleMenu = () => {
    setShowUserMenu(!showUserMenu)
  }

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showUserMenu])

  const handleSignOutClick = async () => {
    setShowUserMenu(false)
    await signOut({ callbackUrl: '/' })
  }

  return (
    <header className="w-full enterprise-header backdrop-blur-xl sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - EXACTLY as it was working */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-enterprise-blue to-enterprise-purple rounded-xl flex items-center justify-center shadow-enterprise">
              <Cpu className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white enterprise-metric">Enterprise Admin</h1>
              <p className="text-sm text-enterprise-slate">System Administration & Monitoring</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/notifications')}
              className="p-2 text-enterprise-slate hover:text-white hover:bg-enterprise-panel rounded-lg transition-colors relative"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-enterprise-red rounded-full animate-enterprise-pulse"></span>
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={toggleMenu}
                className="flex items-center gap-2 p-2 hover:bg-enterprise-panel rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-enterprise-blue to-enterprise-green rounded-full flex items-center justify-center text-white text-sm">
                  {session?.user?.name?.[0] || 'A'}
                </div>
                <ChevronDown size={16} className={`text-enterprise-slate transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div
                  ref={menuRef}
                  className="fixed shadow-enterprise-lg z-[9999] bg-[#1e293b] border border-slate-700 rounded-lg"
                  style={{
                    position: 'fixed',
                    top: '68px', // Adjust this based on your header height (header height + padding)
                    right: '24px', // Match your header padding
                    width: '220px',
                  }}
                >
                  <div className="p-3 border-b border-slate-700">
                    <p className="text-white text-sm font-medium">{session?.user?.name || 'Admin'}</p>
                    <p className="text-slate-400 text-xs truncate">{session?.user?.email || 'admin@example.com'}</p>
                  </div>

                  <div className="p-1">
                    <button
                      onClick={() => router.push('/admin/settings')}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50"
                    >
                      <Settings size={16} />
                      <span>Admin Settings</span>
                    </button>

                    <button
                      onClick={() => router.push('/admin/status')}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50"
                    >
                      <Activity size={16} />
                      <span>System Status</span>
                    </button>
                  </div>

                  <div className="p-1 border-t border-slate-700">
                    <button
                      onClick={handleSignOutClick}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded text-left transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}