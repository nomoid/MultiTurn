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

  private state: T;
  private syncLayer: ServerSyncLayer;
  private stateManager: ServerStateManager<R, T>;
  private started: boolean;
  private standardTurns: boolean;

  public constructor(
    private mainLoop: (server: Server<R, T>) => Promise<void>,
    private remoteGenerator: new () => R,
    private stateGenerator: new () => T,
    private options: ServerOptions<R, T>
  ) {
    this.state = new stateGenerator();
    this.maxPlayers = options.maxPlayers;
    this.standardTurns = options.standardTurns;
    this.started = false;
    this.syncLayer = options.syncLayer;
    this.stateManager = new ServerStateManager(this, options.syncLayer,
      this.state, options.stateMask, remoteGenerator, options.maxPlayers,
      options.typePath, options.cacheTypes,
      options.serializer, options.deserializer);
    this.syncLayer.state = this.stateManager;
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
    await this.stateManager.waitForPlayers();

    // Make a new server when this one is full
    let fullPromise: Promise<void> | undefined;
    const full = this.options.fullCallback;
    if (full) {
      fullPromise = full();
    }
    log.info('Starting main loop.');

    this.stateManager.turn = 0;
    // Run main loop forever
    while (!this.stateManager.gameOver()) {
      try {
        log.debug(`Starting turn ${this.stateManager.turn}`);
        await this.mainLoop.call(this.mainLoop, this);
        if (this.standardTurns) {
          if (this.stateManager.turnIncrementDisabled) {
            this.stateManager.turnIncrementDisabled = false;
          }
          this.stateManager.turn += 1;
          this.stateManager.turn %= this.maxPlayers;
        }
      }
      catch (err) {
        log.error('Error occurred while running main loop!');
        log.error(err);
      }
    }

    if (fullPromise) {
      await fullPromise;
    }
  }

  // Array index will be off by turn number by 1
  public getPlayers(): Array<Player<R>> {
    return this.stateManager.getPlayers();
  }

  // Get the current player
  public getCurrentPlayer(): Player<R> {
    return this.stateManager.getCurrentPlayer();
  }

  public getTurn() {
    return this.stateManager.getTurn();
  }

  public getMaxPlayers(): number {
    return this.maxPlayers;
  }

  public getState() {
    return this.state;
  }

  public gameOver(message: string) {
    if (this.stateManager.gameOver()) {
      throw new Error('Cannot call game over more than once!');
    }
    this.stateManager.endGame(message);
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
  fullCallback: () => Promise<void>;
}
