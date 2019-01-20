export interface ClientSyncLayer {
  responder: ClientSyncResponder;
  listen(): void;
}

export interface ClientSyncResponder {
  onUpdateState(e: ClientSyncStateEvent): void;
  onRequest(e: ClientSyncRequestEvent): Promise<string>;
}

export interface ClientSyncStateEvent {
  readonly state: string;
}

export interface ClientSyncRequestEvent {
  readonly key: string;
  readonly message: string;
}
