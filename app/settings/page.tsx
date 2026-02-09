'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, LogOut, Bell, Volume2, Moon, Brain, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@/contexts/AuthContext';
import { getLocalPreferences, saveLocalPreferences } from '@/lib/user-data';

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  
  const [settings, setSettings] = useState({
    notifications: true,
    soundEffects: true,
    darkMode: true,
    adaptiveLearning: true,
    emotionDetection: true,
  });
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: !prev[key] };
      saveLocalPreferences({ [key]: newSettings[key] });
      return newSettings;
    });
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-atmospheric flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-atmospheric">
      <header className="border-b border-orange-500/20 bg-gray-900/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-orange-500/20 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-xl font-medium">{user?.firstName?.charAt(0) || '👤'}</span>
              </div>
              <div>
                <p className="text-white font-medium">{user?.firstName || 'Guest'} {user?.lastName || ''}</p>
                <p className="text-gray-400 text-sm">{user?.primaryEmailAddress?.emailAddress || 'Not signed in'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-orange-500/20 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Preferences</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-white font-medium">Notifications</p>
                    <p className="text-gray-500 text-sm">Learning reminders</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('notifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications ? 'bg-orange-500' : 'bg-gray-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-white font-medium">Sound Effects</p>
                    <p className="text-gray-500 text-sm">Audio feedback</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('soundEffects')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.soundEffects ? 'bg-orange-500' : 'bg-gray-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.soundEffects ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-white font-medium">Dark Mode</p>
                    <p className="text-gray-500 text-sm">Theme preference</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('darkMode')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.darkMode ? 'bg-orange-500' : 'bg-gray-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-white font-medium">Adaptive Learning</p>
                    <p className="text-gray-500 text-sm">AI adjusts difficulty</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('adaptiveLearning')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.adaptiveLearning ? 'bg-orange-500' : 'bg-gray-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.adaptiveLearning ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-white font-medium">Emotion Detection</p>
                    <p className="text-gray-500 text-sm">Camera analyzes emotions</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('emotionDetection')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emotionDetection ? 'bg-orange-500' : 'bg-gray-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emotionDetection ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>

          <p className="text-center text-gray-600 text-sm">AI Voice Tutor v1.0.0</p>
        </motion.div>
      </main>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-orange-500/20 rounded-xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sign Out?</h3>
              <p className="text-gray-400">Are you sure you want to sign out of your account?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-medium"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
