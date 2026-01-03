/**
 * NOT USED IN PRODUCTION
 * Experimental header variant
 * Do not refactor or merge yet
 */

// src/components/admin/header-with-menu.tsx - MINIMAL WORKING VERSION
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell,
  Settings,
  LogOut,
  User,
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

export function HeaderWithMenu({ session }: HeaderWithMenuProps) {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  // Simple click handlers
  const handleProfileClick = () => {
    setShowUserMenu(false)
    router.push('/admin/profile')
  }

  const handleSettingsClick = () => {
    setShowUserMenu(false)
    router.push('/admin/settings')
  }

  const handleSignOut = async () => {
    setShowUserMenu(false)
    await signOut({ callbackUrl: '/' })
  }

  return (
    <header className="enterprise-header sticky top-0 z-50">
      <div className="px-6 lg:px-8 py-4 relative">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-enterprise-blue to-enterprise-purple rounded-xl flex items-center justify-center">
              <Cpu className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white enterprise-metric">Enterprise Admin</h1>
              <p className="text-sm text-enterprise-slate">System Administration & Monitoring</p>
            </div>
          </div>
          
          {/* Right Section - User Menu & Actions */}
          <div className="flex items-center gap-4">
            <button
              className="p-2 text-enterprise-slate hover:text-white hover:bg-enterprise-panel rounded-lg transition-colors"
              onClick={() => router.push('/admin/notifications')}
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-enterprise-red rounded-full animate-enterprise-pulse"></span>
            </button>
            
            {/* User Menu */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowUserMenu(!showUserMenu)
                }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-enterprise-panel transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-enterprise-blue to-enterprise-green rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {session?.user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-white">{session?.user?.name || 'Admin'}</p>
                  <p className="text-xs text-enterprise-slate">Administrator</p>
                </div>
                <ChevronDown size={16} className={`text-enterprise-slate transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu - SIMPLE AND FIXED */}
              {showUserMenu && (
                <div 
                  ref={menuRef}
                  className="absolute right-0 top-full mt-1 w-56 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl z-50"
                  style={{ 
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.25rem'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-3 border-b border-slate-700">
                    <p className="text-sm font-medium text-white">{session?.user?.name || 'Admin'}</p>
                    <p className="text-xs text-slate-400 truncate">{session?.user?.email || 'admin@example.com'}</p>
                  </div>
                  
                  <div className="py-1">
                    <button 
                      onClick={handleProfileClick}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors text-left"
                    >
                      <User size={16} />
                      <span>Profile Settings</span>
                    </button>
                    <button 
                      onClick={handleSettingsClick}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors text-left"
                    >
                      <Settings size={16} />
                      <span>System Settings</span>
                    </button>
                  </div>
                  
                  <div className="border-t border-slate-700 pt-1">
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors text-left"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
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