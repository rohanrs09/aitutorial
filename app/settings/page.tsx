'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Mic, User, Bell, Volume2, Moon, Globe, Shield, 
  ChevronRight, ArrowLeft, Mail, Smartphone, CreditCard,
  HelpCircle, LogOut, Check, AlertCircle
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { getLocalPreferences, saveLocalPreferences, type UserPreferences } from '@/lib/user-data';

// Check if Clerk is configured
const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Fallback user button
function FallbackUserButton() {
  return (
    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
      <User size={16} className="text-primary-400" />
    </div>
  );
}

// Dynamic Clerk imports with proper error handling
const ClerkUserButton = dynamic(
  () => import('@clerk/nextjs').then(mod => mod.UserButton).catch(() => FallbackUserButton),
  { ssr: false, loading: () => <FallbackUserButton /> }
);

const SignOutButton = dynamic(
  () => import('@clerk/nextjs').then(mod => mod.SignOutButton).catch(() => () => null),
  { ssr: false }
);

// Helper to get user data from Clerk client-side
async function getClerkUserData(): Promise<{
  id?: string;
  firstName?: string;
  lastName?: string;
  emailAddresses?: { emailAddress: string }[];
  imageUrl?: string;
} | null> {
  if (!isClerkConfigured) return null;
  
  try {
    const clerk = await import('@clerk/nextjs');
    // Access clerk from the window object after it's loaded
    if (typeof window !== 'undefined' && (window as Window & { Clerk?: { user?: { id: string; firstName?: string; lastName?: string; emailAddresses?: Array<{ emailAddress: string }>; imageUrl?: string } } }).Clerk?.user) {
      const user = (window as Window & { Clerk?: { user?: { id: string; firstName?: string; lastName?: string; emailAddresses?: Array<{ emailAddress: string }>; imageUrl?: string } } }).Clerk?.user;
      return {
        id: user?.id,
        firstName: user?.firstName || undefined,
        lastName: user?.lastName || undefined,
        emailAddresses: user?.emailAddresses,
        imageUrl: user?.imageUrl,
      };
    }
    return null;
  } catch {
    return null;
  }
}

interface SettingToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function SettingToggle({ label, description, enabled, onToggle }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5">
      <div>
        <p className="text-white font-medium">{label}</p>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-12 h-7 rounded-full transition-colors ${
          enabled ? 'bg-primary-500' : 'bg-surface-lighter'
        }`}
      >
        <motion.div
          animate={{ x: enabled ? 22 : 2 }}
          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
        />
      </button>
    </div>
  );
}

interface SettingLinkProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}

function SettingLink({ icon: Icon, label, description, href, onClick, danger }: SettingLinkProps) {
  const content = (
    <div className={`flex items-center justify-between py-4 border-b border-white/5 cursor-pointer hover:bg-white/5 -mx-4 px-4 transition-colors ${danger ? 'hover:bg-red-500/10' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${danger ? 'bg-red-500/10' : 'bg-surface-lighter'} flex items-center justify-center`}>
          <Icon size={18} className={danger ? 'text-red-400' : 'text-gray-400'} />
        </div>
        <div>
          <p className={`font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{label}</p>
          {description && <p className="text-gray-500 text-sm">{description}</p>}
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-500" />
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return <div onClick={onClick}>{content}</div>;
}

// UserButton wrapper that uses Clerk when configured
function UserButton(props: { afterSignOutUrl?: string }) {
  return isClerkConfigured ? <ClerkUserButton {...props} /> : <FallbackUserButton />;
}

export default function SettingsPage() {
  // User data state
  const [user, setUser] = useState<{
    id?: string;
    firstName?: string;
    lastName?: string;
    emailAddresses?: { emailAddress: string }[];
    imageUrl?: string;
  } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: true,
    soundEffects: true,
    darkMode: true,
    adaptiveLearning: true,
    emotionDetection: true,
  });
  
  // UI state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load Clerk user data
  useEffect(() => {
    const loadUser = async () => {
      if (isClerkConfigured) {
        // Try to get user from Clerk
        const clerkUser = await getClerkUserData();
        if (clerkUser) {
          setUser(clerkUser);
          // Cache user for other pages
          localStorage.setItem('clerk_user_cache', JSON.stringify(clerkUser));
        } else {
          // Try localStorage cache
          const cachedUser = localStorage.getItem('clerk_user_cache');
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
          }
        }
      } else {
        // Demo mode
        setUser({
          firstName: 'Demo',
          lastName: 'User',
          emailAddresses: [{ emailAddress: 'demo@example.com' }]
        });
      }
      setIsLoaded(true);
    };
    loadUser();
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    const prefs = getLocalPreferences();
    setSettings({
      notifications: prefs.notifications,
      soundEffects: prefs.soundEffects,
      darkMode: prefs.darkMode,
      adaptiveLearning: prefs.adaptiveLearning,
      emotionDetection: prefs.emotionDetection,
    });
  }, []);

  const toggleSetting = useCallback((key: keyof typeof settings) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: !prev[key] };
      // Save to localStorage
      saveLocalPreferences({ [key]: newSettings[key] });
      
      // Show save feedback
      setSaveStatus('saving');
      setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 300);
      
      return newSettings;
    });
  }, []);
  
  // Handle sign out
  const handleSignOut = useCallback(() => {
    // Clear local storage
    localStorage.removeItem('clerk_user_cache');
    localStorage.removeItem('ai_tutor_current_session');
    
    // Redirect to home
    window.location.href = '/';
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-lg font-semibold text-white">Settings</h1>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Save Status Indicator */}
        {saveStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-lg flex items-center gap-2 text-sm ${
              saveStatus === 'saving' ? 'bg-blue-500/20 text-blue-400' :
              saveStatus === 'saved' ? 'bg-green-500/20 text-green-400' :
              'bg-red-500/20 text-red-400'
            }`}
          >
            {saveStatus === 'saving' && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            {saveStatus === 'saved' && <Check size={16} />}
            {saveStatus === 'error' && <AlertCircle size={16} />}
            <span>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Error'}</span>
          </motion.div>
        )}
        {/* Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
        >
          <div className="flex items-center gap-4 pb-4 border-b border-white/5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {user?.firstName || 'User'} {user?.lastName || ''}
              </h2>
              <p className="text-gray-400">{user?.emailAddresses?.[0]?.emailAddress || 'No email'}</p>
            </div>
          </div>

          <SettingLink 
            icon={User} 
            label="Edit Profile" 
            description="Update your name and photo"
            href="/user-profile"
          />
          <SettingLink 
            icon={Mail} 
            label="Email Settings" 
            description="Manage email preferences"
          />
          <SettingLink 
            icon={Smartphone} 
            label="Connected Devices" 
            description="Manage your devices"
          />
        </motion.section>

        {/* Learning Preferences */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Learning Preferences</h3>
          
          <SettingToggle
            label="Adaptive Learning"
            description="AI adjusts difficulty based on your performance"
            enabled={settings.adaptiveLearning}
            onToggle={() => toggleSetting('adaptiveLearning')}
          />
          <SettingToggle
            label="Emotion Detection"
            description="Use camera to detect emotions and adapt teaching"
            enabled={settings.emotionDetection}
            onToggle={() => toggleSetting('emotionDetection')}
          />
          
          <SettingLink 
            icon={Globe} 
            label="Language" 
            description="English (US)"
          />
          <SettingLink 
            icon={Volume2} 
            label="Voice Settings" 
            description="Choose tutor voice and speed"
          />
        </motion.section>

        {/* App Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card mb-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">App Settings</h3>
          
          <SettingToggle
            label="Push Notifications"
            description="Get reminders to keep your streak"
            enabled={settings.notifications}
            onToggle={() => toggleSetting('notifications')}
          />
          <SettingToggle
            label="Sound Effects"
            description="Play sounds for achievements and actions"
            enabled={settings.soundEffects}
            onToggle={() => toggleSetting('soundEffects')}
          />
          <SettingToggle
            label="Dark Mode"
            description="Use dark theme (recommended)"
            enabled={settings.darkMode}
            onToggle={() => toggleSetting('darkMode')}
          />
        </motion.section>

        {/* Subscription */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card mb-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Subscription</h3>
          
          <div className="p-4 bg-gradient-to-br from-primary-500/20 to-pink-500/20 rounded-xl border border-primary-500/30 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">Free Plan</span>
              <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full">Current</span>
            </div>
            <p className="text-gray-400 text-sm mb-3">10 voice sessions per month</p>
            <Link 
              href="/#pricing" 
              className="btn-primary text-sm w-full justify-center"
            >
              Upgrade to Pro
            </Link>
          </div>

          <SettingLink 
            icon={CreditCard} 
            label="Billing & Payments" 
            description="Manage payment methods"
          />
        </motion.section>

        {/* Support & Legal */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card mb-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
          
          <SettingLink 
            icon={HelpCircle} 
            label="Help Center" 
            description="FAQs and tutorials"
          />
          <SettingLink 
            icon={Mail} 
            label="Contact Support" 
            description="Get help from our team"
          />
          <SettingLink 
            icon={Shield} 
            label="Privacy Policy" 
          />
        </motion.section>

        {/* Sign Out */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          {isClerkConfigured ? (
            <SignOutButton>
              <div className="flex items-center justify-between py-4 border-b border-white/5 cursor-pointer hover:bg-red-500/10 -mx-4 px-4 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <LogOut size={18} className="text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium text-red-400">Sign Out</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-500" />
              </div>
            </SignOutButton>
          ) : (
            <div 
              onClick={handleSignOut}
              className="flex items-center justify-between py-4 border-b border-white/5 cursor-pointer hover:bg-red-500/10 -mx-4 px-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <LogOut size={18} className="text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-red-400">Sign Out</p>
                  <p className="text-gray-500 text-sm">Clear session and return home</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-500" />
            </div>
          )}
        </motion.section>

        {/* Version */}
        <p className="text-center text-gray-600 text-sm mt-8">
          AI Voice Tutor v1.0.0
        </p>
      </main>
    </div>
  );
}
