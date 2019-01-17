interface SIOSocket {
  emit(key: string, message?: string): void;
  on(key: string, callback: (s: string) => void): void;
  disconnect(): void;
}

interface SIOServer {
  on(key: 'connection', callback: (s: SIOSocket) => void): void;
}
