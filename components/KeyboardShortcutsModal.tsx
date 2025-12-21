'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Search } from 'lucide-react';
import { KEYBOARD_SHORTCUTS, KeyboardShortcut } from '@/lib/keyboard-shortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({
  isOpen,
  onClose
}: KeyboardShortcutsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredShortcuts, setFilteredShortcuts] = useState<KeyboardShortcut[]>(KEYBOARD_SHORTCUTS);

  useEffect(() => {
    const filtered = KEYBOARD_SHORTCUTS.filter(shortcut =>
      shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shortcut.action.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredShortcuts(filtered);
  }, [searchTerm]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const formatKeyCombination = (shortcut: KeyboardShortcut): string => {
    const keys = [...shortcut.keys];
    const modifiers = [];

    if (shortcut.ctrlKey) modifiers.push('Ctrl');
    if (shortcut.shiftKey) modifiers.push('Shift');
    if (shortcut.altKey) modifiers.push('Alt');

    const allKeys = [...modifiers, ...keys];
    return allKeys.join(' + ');
  };

  const groupedShortcuts = Object.groupBy(
    filteredShortcuts,
    (shortcut) => {
      if (shortcut.action.includes('voice') || shortcut.action.includes('text')) return 'Input';
      if (shortcut.action.includes('slide')) return 'Navigation';
      if (shortcut.action.includes('toggle')) return 'Display';
      return 'Other';
    }
  ) as Record<string, KeyboardShortcut[]>;

  const categoryOrder = ['Input', 'Navigation', 'Display', 'Other'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 border-b border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Keyboard size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
                    <p className="text-purple-100 text-sm">Master your learning experience with keyboard shortcuts</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="Close shortcuts modal"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mt-4 relative">
                <Search size={18} className="absolute left-3 top-3 text-white/60" />
                <input
                  type="text"
                  placeholder="Search shortcuts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/20 text-white placeholder-white/60 rounded-lg focus:outline-none focus:bg-white/30 transition-colors"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredShortcuts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Keyboard size={48} className="mb-4 opacity-30" />
                  <p>No shortcuts found matching &quot;{searchTerm}&quot;</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {categoryOrder.map((category) => {
                    const shortcuts = groupedShortcuts[category];
                    if (!shortcuts || shortcuts.length === 0) return null;

                    return (
                      <motion.div
                        key={category}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Object.keys(groupedShortcuts).indexOf(category) * 0.1 }}
                      >
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                          {category}
                        </h3>
                        <div className="space-y-3">
                          {shortcuts.map((shortcut, index) => (
                            <motion.div
                              key={shortcut.action}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                            >
                              <p className="text-gray-700 text-sm">{shortcut.description}</p>
                              <div className="flex gap-2">
                                {formatKeyCombination(shortcut).split(' + ').map((key, i) => (
                                  <div key={i} className="flex items-center gap-1">
                                    {i > 0 && <span className="text-gray-400 text-xs">+</span>}
                                    <kbd className="px-3 py-1.5 bg-gray-200 text-gray-800 text-xs font-mono rounded-md border border-gray-300 group-hover:bg-gray-300 transition-colors shadow-sm">
                                      {key}
                                    </kbd>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">
              <p>💡 Tip: Press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">?</kbd> anytime to show this menu</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
