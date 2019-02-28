import { ServerSyncLayer, StateManager } from '../sync/server';
import Player from './player';
import ServerStateManager from './state';

const gameOverId = '_gameOver';

// Type of player: R
// Type of state: T
export default class Server<R, T> {

  public readonly maxPlayers: number;

  private syncLayer: ServerSyncLayer;
  private state: ServerStateManager<R, T>;
  private turn: number;
  private standardTurns: boolean;
  private turnIncrementDisabled: boolean;
  private gameIsOver: boolean;
  private started: boolean;

  public constructor(
    private mainLoop: (server: Server<R, T>) => Promise<void>,
    remoteGenerator: new () => R,
    state: T,
    options: ServerOptions<R, T>
  ) {
    this.maxPlayers = options.maxPlayers;
    this.turn = 0;
    this.standardTurns = options.standardTurns;
    this.turnIncrementDisabled = false;
    this.gameIsOver = false;
    this.started = false;
    this.syncLayer = options.syncLayer;
    this.state = new ServerStateManager(this, options.syncLayer, state,
      options.stateMask, remoteGenerator, options.typePath);
    this.syncLayer.state = this.state;
  }

  public async start() {
    if (this.started) {
      throw new Error('Game cannot be started more than once!');
    }
    this.started = true;
    this.syncLayer.listen();

    // Wait until enough players have joined
    await this.state.waitForPlayers();

    // Run main loop forever
    while (true) {
      try {
        await this.mainLoop.call(this.mainLoop, this);
        if (this.standardTurns) {
          if (this.turnIncrementDisabled) {
            this.turnIncrementDisabled = false;
          }
          this.turn += 1;
          this.turn %= this.maxPlayers;
        }
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

  public getCurrentPlayer(): Player<R> {
    return this.state.getPlayers()[this.getTurn()];
  }

  public getTurn(): number {
    return this.turn;
  }

  public getMaxPlayers(): number {
    return this.maxPlayers;
  }

  // Warning: standard turns already increases turn count,
  // setTurn disables next turn increment
  public setTurn(turn: number) {
    if (turn < 0 || turn >= this.maxPlayers || !Number.isInteger(turn)) {
      throw new Error(`Invalid turn count ${turn}`);
    }
    this.turn = turn;
    this.turnIncrementDisabled = true;
  }

  public gameOver(message: string) {
    if (this.gameIsOver) {
      throw new Error('Cannot call game over more than once!');
    }
    this.gameIsOver = true;
    this.syncLayer.requestAll(gameOverId, message);
  }
}

type StateMask<R, T> = (state: T, player: Player<R>) => string;

export interface ServerOptions<R, T> {
  syncLayer: ServerSyncLayer;
  stateMask: StateMask<R, T>;
  maxPlayers: number;
  typePath: string;
  standardTurns: boolean;
}
