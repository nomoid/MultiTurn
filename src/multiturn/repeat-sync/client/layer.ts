import { NetworkLayer, ConnectionEvent, RequestEvent } from '../../network/network';
import { ClientSyncLayer, ClientSyncResponder, ClientSyncCombinedEvent } from '../../sync/client';

const requestId = '_syncRequest';
const updateId = '_syncUpdate';
const emptyResponse = '';

function validateRequest(r: any): r is ClientSyncCombinedEvent {
  if (r.key !== undefined && r.value !== undefined && r.state !== undefined) {
    return true;
  }
  else {
    return false;
  }
}

export default class RepeatClientSyncLayer implements ClientSyncLayer {

  public constructor(public layer: NetworkLayer,
    public responder: ClientSyncResponder) {

  }

  public listen(): void {
    this.layer.addConnectionListener((e: ConnectionEvent) => {
      const sock = e.accept();
      sock.addRequestListener((e2: RequestEvent) => {
        const requestEvent = JSON.parse(e2.message);
        if (validateRequest(requestEvent)) {
          if (e2.key === requestId) {
            this.responder.onUpdateState(requestEvent);
            this.responder.onRequest(requestEvent)
              .then((s: string) => e2.respond(s));
          } else if (e2.key === updateId) {
            this.responder.onUpdateState(requestEvent);
            e2.respond(emptyResponse);
          }
          // Invalid server request, silently ignore for now
        }
        // Invalid server request, silently ignore for now
      });
    });
    this.layer.listen();
  }
}
