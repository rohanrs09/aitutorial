/**
 * Keyboard Shortcuts and Accessibility Handler
 * Provides global keyboard navigation and accessibility features
 */

export type KeyboardAction = 
  | 'toggle-voice-input'
  | 'toggle-text-input'
  | 'submit-text'
  | 'toggle-notes'
  | 'toggle-camera'
  | 'toggle-subtitles'
  | 'next-slide'
  | 'prev-slide'
  | 'toggle-chat-history'
  | 'interrupt-tutor'
  | 'open-settings'
  | 'focus-topic-selector'
  | 'focus-voice-input'
  | 'focus-text-input';

export interface KeyboardShortcut {
  keys: string[];
  action: KeyboardAction;
  description: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  {
    keys: ['Space'],
    action: 'toggle-voice-input',
    description: 'Hold Space to speak'
  },
  {
    keys: ['Tab'],
    action: 'focus-voice-input',
    description: 'Focus voice input'
  },
  {
    keys: ['Shift', 'Tab'],
    action: 'focus-text-input',
    description: 'Focus text input',
    shiftKey: true
  },
  {
    keys: ['Enter'],
    action: 'submit-text',
    description: 'Submit text message',
    ctrlKey: true
  },
  {
    keys: ['N'],
    action: 'toggle-notes',
    description: 'Toggle notes sidebar',
    ctrlKey: true
  },
  {
    keys: ['C'],
    action: 'toggle-camera',
    description: 'Toggle camera widget',
    ctrlKey: true
  },
  {
    keys: ['S'],
    action: 'toggle-subtitles',
    description: 'Toggle subtitles',
    ctrlKey: true
  },
  {
    keys: ['ArrowRight'],
    action: 'next-slide',
    description: 'Next slide'
  },
  {
    keys: ['ArrowLeft'],
    action: 'prev-slide',
    description: 'Previous slide'
  },
  {
    keys: ['H'],
    action: 'toggle-chat-history',
    description: 'Toggle chat history',
    ctrlKey: true
  },
  {
    keys: ['Escape'],
    action: 'interrupt-tutor',
    description: 'Interrupt tutor'
  },
  {
    keys: [','],
    action: 'open-settings',
    description: 'Open settings'
  },
  {
    keys: ['T'],
    action: 'focus-topic-selector',
    description: 'Focus topic selector',
    ctrlKey: true
  }
];

export class KeyboardShortcutManager {
  private listeners: Map<KeyboardAction, Set<() => void>> = new Map();
  private isInputFocused = false;

  constructor() {
    this.setupGlobalKeyboard();
  }

  private setupGlobalKeyboard() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('focus', (e) => this.updateInputFocus(e), true);
    document.addEventListener('blur', (e) => this.updateInputFocus(e), true);
  }

  private updateInputFocus(e: Event) {
    const target = e.target as HTMLElement;
    this.isInputFocused = 
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement;
  }

  private handleKeyDown(event: KeyboardEvent) {
    for (const shortcut of KEYBOARD_SHORTCUTS) {
      if (this.matchesShortcut(event, shortcut)) {
        // Don't intercept keyboard input if user is typing in a field
        if (this.isInputFocused && !['submit-text'].includes(shortcut.action)) {
          continue;
        }

        event.preventDefault();
        this.triggerAction(shortcut.action);
        break;
      }
    }
  }

  private matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    const keyMatch = shortcut.keys.some(key => 
      this.normalizeKey(event.key) === this.normalizeKey(key)
    );

    if (!keyMatch) return false;

    if (shortcut.ctrlKey && !event.ctrlKey && !event.metaKey) return false;
    if (shortcut.shiftKey && !event.shiftKey) return false;
    if (shortcut.altKey && !event.altKey) return false;

    return true;
  }

  private normalizeKey(key: string): string {
    const keyMap: Record<string, string> = {
      'Control': 'Control',
      'Meta': 'Control',
      ' ': 'Space',
      'Spacebar': 'Space'
    };
    return keyMap[key] || key;
  }

  on(action: KeyboardAction, callback: () => void) {
    if (!this.listeners.has(action)) {
      this.listeners.set(action, new Set());
    }
    this.listeners.get(action)!.add(callback);

    return () => {
      this.listeners.get(action)!.delete(callback);
    };
  }

  private triggerAction(action: KeyboardAction) {
    const callbacks = this.listeners.get(action);
    if (callbacks) {
      callbacks.forEach(cb => cb());
    }
  }

  getShortcutDescription(action: KeyboardAction): string {
    const shortcut = KEYBOARD_SHORTCUTS.find(s => s.action === action);
    if (!shortcut) return '';

    let keys = shortcut.keys.join(' + ');
    if (shortcut.ctrlKey) keys = 'Ctrl + ' + keys;
    if (shortcut.shiftKey) keys = 'Shift + ' + keys;
    if (shortcut.altKey) keys = 'Alt + ' + keys;

    return `${keys}: ${shortcut.description}`;
  }

  getAllShortcuts(): KeyboardShortcut[] {
    return KEYBOARD_SHORTCUTS;
  }

  dispose() {
    this.listeners.clear();
  }
}
