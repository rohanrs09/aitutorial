'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronDown, ChevronUp, Download, Mail, Copy, Check, BookOpen, Lightbulb, Target } from 'lucide-react';

interface Note {
  id: string;
  type: 'concept' | 'example' | 'tip' | 'summary';
  content: string;
  timestamp: Date;
}

interface NotesPanelProps {
  notes: Note[];
  topic: string;
  onEmailNotes?: () => void;
  onDownloadNotes?: () => void;
}

export default function NotesPanel({
  notes,
  topic,
  onEmailNotes,
  onDownloadNotes
}: NotesPanelProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['concepts', 'tips']);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const copyNote = (note: Note) => {
    navigator.clipboard.writeText(note.content);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const groupedNotes = {
    concepts: notes.filter(n => n.type === 'concept'),
    examples: notes.filter(n => n.type === 'example'),
    tips: notes.filter(n => n.type === 'tip'),
    summaries: notes.filter(n => n.type === 'summary')
  };

  const sectionConfig = {
    concepts: { icon: BookOpen, title: 'Key Concepts', color: 'text-blue-400' },
    examples: { icon: Target, title: 'Examples', color: 'text-green-400' },
    tips: { icon: Lightbulb, title: 'Tips & Tricks', color: 'text-yellow-400' },
    summaries: { icon: FileText, title: 'Summaries', color: 'text-purple-400' }
  };

  return (
    <div className="h-full flex flex-col bg-surface/50">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-1 sm:mb-2">
          <FileText size={16} className="text-purple-400 sm:w-[18px] sm:h-[18px]" />
          <h3 className="font-semibold text-white text-sm sm:text-base">Session Notes</h3>
        </div>
        <p className="text-xs sm:text-sm text-gray-400 truncate">{topic}</p>
      </div>

      {/* Notes Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 scrollbar-hide">
        {Object.entries(groupedNotes).map(([section, sectionNotes]) => {
          if (sectionNotes.length === 0) return null;
          
          const config = sectionConfig[section as keyof typeof sectionConfig];
          const Icon = config.icon;
          const isExpanded = expandedSections.includes(section);

          return (
            <div key={section} className="bg-white/5 rounded-lg sm:rounded-xl overflow-hidden">
              {/* Section Header - Touch-friendly */}
              <button
                onClick={() => toggleSection(section)}
                className="w-full flex items-center justify-between p-3 sm:p-4 min-h-touch hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className={`${config.color} sm:w-4 sm:h-4`} />
                  <span className="text-xs sm:text-sm font-medium text-white">{config.title}</span>
                  <span className="text-xs text-gray-500 bg-white/10 px-1.5 sm:px-2 py-0.5 rounded-full">
                    {sectionNotes.length}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp size={14} className="text-gray-400 sm:w-4 sm:h-4" />
                ) : (
                  <ChevronDown size={14} className="text-gray-400 sm:w-4 sm:h-4" />
                )}
              </button>

              {/* Section Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-2 sm:px-3 pb-2 sm:pb-3 space-y-2">
                      {sectionNotes.map((note) => (
                        <div
                          key={note.id}
                          className="group relative p-2.5 sm:p-3 bg-white/5 rounded-lg text-xs sm:text-sm text-gray-300 hover:bg-white/10 active:bg-white/15 transition-colors"
                        >
                          <p className="pr-8 leading-relaxed">{note.content}</p>
                          <button
                            onClick={() => copyNote(note)}
                            className="absolute top-2 right-2 p-1.5 sm:p-2 min-h-touch min-w-touch flex items-center justify-center opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 active:bg-white/20 rounded-lg"
                          >
                            {copiedId === note.id ? (
                              <Check size={14} className="text-green-400 sm:w-4 sm:h-4" />
                            ) : (
                              <Copy size={14} className="text-gray-400 sm:w-4 sm:h-4" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {notes.length === 0 && (
          <div className="text-center py-6 sm:py-8">
            <FileText size={28} className="text-gray-600 mx-auto mb-2 sm:mb-3 sm:w-8 sm:h-8" />
            <p className="text-xs sm:text-sm text-gray-500">Notes will appear here as you learn</p>
          </div>
        )}
      </div>

      {/* Footer Actions - Touch-friendly */}
      {notes.length > 0 && (
        <div className="p-3 sm:p-4 border-t border-white/10 space-y-2">
          <button
            onClick={onDownloadNotes}
            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 min-h-touch text-xs sm:text-sm text-gray-300 hover:text-white hover:bg-white/5 active:bg-white/10 rounded-lg sm:rounded-xl transition-colors"
          >
            <Download size={14} className="sm:w-4 sm:h-4" />
            Download Notes
          </button>
          <button
            onClick={onEmailNotes}
            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 min-h-touch text-xs sm:text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 active:bg-purple-500/20 rounded-lg sm:rounded-xl transition-colors"
          >
            <Mail size={14} className="sm:w-4 sm:h-4" />
            Email to Me
          </button>
        </div>
      )}
    </div>
  );
}
