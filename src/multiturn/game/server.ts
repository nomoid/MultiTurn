import * as logger from 'loglevel';
import { Serializer, Deserializer } from '../sio-network/serializer';
import { ServerSyncLayer, StateManager } from '../sync/server';
import Player from './player';
import ServerStateManager from './state';

const log = logger.getLogger('Game');

const gameOverId = '_gameOver';

// Type of player: R
// Type of state: T
export default class Server<R, T> {

  public readonly maxPlayers: number;

  private syncLayer: ServerSyncLayer;
  private state: ServerStateManager<R, T>;
  private started: boolean;
  private standardTurns: boolean;

  public constructor(
    private mainLoop: (server: Server<R, T>) => Promise<void>,
    remoteGenerator: new () => R,
    state: T,
    options: ServerOptions<R, T>
  ) {
    this.maxPlayers = options.maxPlayers;
    this.standardTurns = options.standardTurns;
    this.started = false;
    this.syncLayer = options.syncLayer;
    this.state = new ServerStateManager(this, options.syncLayer, state,
      options.stateMask, remoteGenerator, options.maxPlayers,
      options.typePath, options.cacheTypes,
      options.serializer, options.deserializer);
    this.syncLayer.state = this.state;
  }

  public async start() {
    if (this.started) {
      throw new Error('Game cannot be started more than once!');
    }
    this.started = true;

    log.info('Server listening.');

    this.syncLayer.listen();

    log.info('Waiting for players...');

    // Wait until enough players have joined
    await this.state.waitForPlayers();

    log.info('Starting main loop.');

    this.state.turn = 0;
    // Run main loop forever
    while (!this.state.gameOver()) {
      try {
        log.debug(`Starting turn ${this.state.turn}`);
        await this.mainLoop.call(this.mainLoop, this);
        if (this.standardTurns) {
          if (this.state.turnIncrementDisabled) {
            this.state.turnIncrementDisabled = false;
          }
          this.state.turn += 1;
          this.state.turn %= this.maxPlayers;
        }
      }
      catch (err) {
        log.error('Error occurred while running main loop!');
        log.error(err);
      }
    }
  }

  // Array index will be off by turn number by 1
  public getPlayers(): Array<Player<R>> {
    return this.state.getPlayers();
  }

  // Get the current player
  public getCurrentPlayer(): Player<R> {
    return this.state.getCurrentPlayer();
  }

  public getTurn() {
    return this.state.getTurn();
  }

  public getMaxPlayers(): number {
    return this.maxPlayers;
  }

  public gameOver(message: string) {
    if (this.state.gameOver()) {
      throw new Error('Cannot call game over more than once!');
    }
    this.state.endGame(message);
    this.syncLayer.update();
  }
}

type StateMask<R, T> = (state: T, player: Player<R>) => string;

export interface ServerOptions<R, T> {
  syncLayer: ServerSyncLayer;
  stateMask: StateMask<R, T>;
  maxPlayers: number;
  typePath: string;
  standardTurns: boolean;
  serializer: Serializer;
  deserializer: Deserializer;
  cacheTypes: boolean;
}
