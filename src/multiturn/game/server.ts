import { ServerSyncLayer, StateManager } from '../sync/server';
import Player from './player';
import ServerStateManager from './state';

// Type of player: R
// Type of state: T
export default class Server<R, T> {

  public readonly maxPlayers: number;

  private syncLayer: ServerSyncLayer;
  private state: ServerStateManager<R, T>;

  public constructor(
    private mainLoop: (server: Server<R, T>) => Promise<void>,
    remoteGenerator: new () => R,
    state: T,
    options: ServerOptions<R, T>
  ) {
    this.maxPlayers = options.maxPlayers;
    this.syncLayer = options.syncLayer;
    this.state = new ServerStateManager(this, state,
      options.stateMask, remoteGenerator, options.typePath);
    this.syncLayer.state = this.state;
  }

  public async start() {
    this.syncLayer.listen();

    // Wait until enough players have joined
    await this.state.waitForPlayers();

    // Run main loop forever
    while (true) {
      try {
        await this.mainLoop.call(this.mainLoop, this);
      }
      catch (err) {
        console.log('Error occurred while running main loop!');
        console.error(err);
      }
    }
  }

  public getPlayers(): Array<Player<R>> {
    return this.state.getPlayers();
  }
}

type StateMask<R, T> = (state: T, player: Player<R>) => string;

export interface ServerOptions<R, T> {
  syncLayer: ServerSyncLayer;
  stateMask: StateMask<R, T>;
  maxPlayers: number;
  typePath: string;
}
