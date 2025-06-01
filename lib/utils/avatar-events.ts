// Simple event system for avatar updates
class AvatarEventEmitter {
  private listeners: ((userId: string, newAvatarUrl: string | null) => void)[] = [];

  subscribe(callback: (userId: string, newAvatarUrl: string | null) => void) {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  emit(userId: string, newAvatarUrl: string | null) {
    this.listeners.forEach(callback => {
      try {
        callback(userId, newAvatarUrl);
      } catch (error) {
        console.error('Error in avatar event listener:', error);
      }
    });
  }
}

export const avatarEvents = new AvatarEventEmitter();
