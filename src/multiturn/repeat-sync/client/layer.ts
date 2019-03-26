import * as logger from 'loglevel';
import { NetworkLayer, ConnectionEvent, RequestEvent, SocketCloseEvent } from '../../network/network';
import { ClientSyncLayer, ClientSyncResponder, ClientSyncCombinedEvent } from '../../sync/client';

const log = logger.getLogger('Sync');

const requestId = '_syncRequest';
const updateId = '_syncUpdate';
const emptyResponse = '';

function validateRequest(r: any): r is ClientSyncCombinedEvent {
  if (r.state !== undefined) {
    return true;
  }
  else {
    return false;
  }
}

export default class RepeatClientSyncLayer implements ClientSyncLayer {

  private listening: boolean = false;

  public constructor(public layer: NetworkLayer,
    public responder: ClientSyncResponder) {

  }

  public listen(): void {
    if (this.listening) {
      return;
    }
    this.listening = true;
    this.layer.addConnectionListener((e: ConnectionEvent) => {
      const sock = e.accept();
      sock.addRequestListener((e2: RequestEvent) => {
        if (e2.key === requestId) {
          const requestEvent = JSON.parse(e2.message);
          if (validateRequest(requestEvent)) {
            log.debug(`Update state: ${requestEvent.state}`);
            log.debug(`Valid request: ${requestEvent.key},${requestEvent.message}`);
            this.responder.onUpdateState(requestEvent)
              .then(() => this.responder.onRequest(requestEvent))
              .then((s: string) => e2.respond(s));
          }
          else {
            log.warn('Invalid request!');
          }
        } else if (e2.key === updateId) {
          log.debug(`Update state: ${e2.message}`);
          this.responder.onUpdateState({state: e2.message})
            .then(() => e2.respond(emptyResponse));
        } else {
          log.warn(`Invalid key: ${e2.key}`);
        }
      });
      sock.addCloseListener((e2: SocketCloseEvent) => {
        this.responder.onClose(e2);
      });
    });
    this.layer.listen();
  }
}
