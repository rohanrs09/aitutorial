// Global event system for credit updates
type CreditChangeListener = () => void;

class CreditsEventEmitter {
  private listeners: Set<CreditChangeListener> = new Set();

  subscribe(listener: CreditChangeListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit() {
    this.listeners.forEach(listener => listener());
  }
}

export const creditsEvents = new CreditsEventEmitter();

// Helper to invalidate credits cache and notify all listeners
export function invalidateCreditsCache() {
  creditsEvents.emit();
}
