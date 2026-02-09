'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, X } from 'lucide-react';
import { useAuth, useUser } from '@/contexts/AuthContext';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900/95 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-6 mx-4 max-w-sm shadow-2xl shadow-black/50 shadow-orange-500/5 sm:mx-auto sm:max-w-md">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <LogOut className="w-7 h-7 text-red-400" />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-white text-center mb-2">
          Sign Out
        </h3>
        <p className="text-sm text-gray-400 text-center mb-6">
          Are you sure you want to sign out? You&apos;ll need to sign in again to access your learning data.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 rounded-xl transition-all shadow-lg shadow-orange-500/30"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function UserButtonWithLogout() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center overflow-hidden">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt={user.firstName || 'User'} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-sm font-medium">{user?.firstName?.charAt(0) || '👤'}</span>
          )}
        </div>
        <button 
          onClick={() => setShowLogoutModal(true)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleSignOut}
      />
    </>
  );
}

export default LogoutConfirmModal;
