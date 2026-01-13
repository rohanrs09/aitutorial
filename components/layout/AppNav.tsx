'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, BarChart3, Settings, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function FallbackUserButton() {
  return (
    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
      <span className="text-primary-400 text-sm">👤</span>
    </div>
  );
}

const ClerkUserButton = dynamic(
  () => import('@clerk/nextjs').then(mod => mod.UserButton).catch(() => FallbackUserButton),
  { ssr: false, loading: () => <FallbackUserButton /> }
);

function UserButton() {
  return isClerkConfigured ? <ClerkUserButton /> : <FallbackUserButton />;
}

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/dashboard', label: 'Progress', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Navigation - Left Sidebar */}
      <nav className="hidden lg:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-6 bg-surface border-r border-white/5 z-40">
        {/* Logo */}
        <Link href="/dashboard" className="mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">AI</span>
          </div>
        </Link>

        {/* Nav Items */}
        <div className="flex-1 flex flex-col gap-2 w-full px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 py-3 rounded-xl transition-all',
                  isActive
                    ? 'bg-primary-500/10 text-primary-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon size={20} />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Button */}
        <div className="mt-auto">
          <UserButton />
        </div>
      </nav>

      {/* Mobile Navigation - Top Bar */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-lg border-b border-white/5 z-40">
        <div className="flex items-center justify-between h-full px-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="font-bold text-white">AI Tutor</span>
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <UserButton />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-surface border-b border-white/5 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 transition-colors',
                    isActive
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-white/5 z-40">
        <div className="flex items-center justify-around h-full px-2">
          {navItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all min-w-[60px]',
                  isActive
                    ? 'text-primary-400'
                    : 'text-gray-400'
                )}
              >
                <item.icon size={20} />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
