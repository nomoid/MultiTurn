export interface ClientSyncLayer {
  responder: ClientSyncResponder;
  listen(): void;
}

export interface ClientSyncResponder {
  onUpdateState(e: ClientSyncStateEvent): Promise<void>;
  onRequest(e: ClientSyncRequestEvent): Promise<string>;
  onClose(e: ClientSyncCloseEvent): void;
}

export interface ClientSyncStateEvent {
  readonly state: string;
}

export interface ClientSyncRequestEvent {
  readonly key: string;
  readonly message: string;
}

export interface ClientSyncCombinedEvent {
  readonly key: string;
  readonly message: string;
  readonly state: string;
}

export interface ClientSyncCloseEvent {
  readonly reason?: string;
}
