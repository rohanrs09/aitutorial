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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={18} className="text-purple-400" />
          <h3 className="font-semibold text-white">Session Notes</h3>
        </div>
        <p className="text-sm text-gray-400 truncate">{topic}</p>
      </div>

      {/* Notes Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(groupedNotes).map(([section, sectionNotes]) => {
          if (sectionNotes.length === 0) return null;
          
          const config = sectionConfig[section as keyof typeof sectionConfig];
          const Icon = config.icon;
          const isExpanded = expandedSections.includes(section);

          return (
            <div key={section} className="bg-white/5 rounded-lg overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section)}
                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} className={config.color} />
                  <span className="text-sm font-medium text-white">{config.title}</span>
                  <span className="text-xs text-gray-500 bg-white/10 px-2 py-0.5 rounded-full">
                    {sectionNotes.length}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
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
                    <div className="px-3 pb-3 space-y-2">
                      {sectionNotes.map((note) => (
                        <div
                          key={note.id}
                          className="group relative p-2 bg-white/5 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
                        >
                          <p className="pr-8">{note.content}</p>
                          <button
                            onClick={() => copyNote(note)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                          >
                            {copiedId === note.id ? (
                              <Check size={14} className="text-green-400" />
                            ) : (
                              <Copy size={14} className="text-gray-400" />
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
          <div className="text-center py-8">
            <FileText size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Notes will appear here as you learn</p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {notes.length > 0 && (
        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={onDownloadNotes}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <Download size={16} />
            Download Notes
          </button>
          <button
            onClick={onEmailNotes}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
          >
            <Mail size={16} />
            Email to Me
          </button>
        </div>
      )}
    </div>
  );
}
