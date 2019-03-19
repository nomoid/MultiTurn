import PromiseHolder from '../helper/promiseholder';
import RemoteValidator, { setupRemote } from '../remote/validator';
import { Serializer, Deserializer } from '../sio-network/serializer';
import { StateManager, SyncUserEvent, SyncUser, ServerSyncLayer } from '../sync/server';
import { ServerInfo, CombinedInfo } from './info';
import Player from './player';
import Server from './server';

const assignNumId = '_assignNum';
const remoteCallId = '_remoteCall';

export default class ServerStateManager<R, T> implements StateManager {
  public turn: number;
  public gameIsOver: boolean;
  public gameOverMessage?: string;
  public turnIncrementDisabled: boolean;

  private idMap: Map<string, SyncUser> = new Map();
  private playerMap: Map<string, Player<R>> = new Map();
  private users: string[] = [];
  private playerPromises: Array<PromiseHolder<void>> = [];

  public constructor(private server: Server<R, T>,
    private syncLayer: ServerSyncLayer,
    private state: T, private stateMask: (state: T,
    player: Player<R>) => string, private remoteGenerator: new () => R,
    private maxPlayers: number,
    private typePath: string,
    private cacheTypes: boolean,
    private serializer: Serializer, private deserializer: Deserializer) {
      this.turnIncrementDisabled = false;
      this.gameIsOver = false;
      this.turn = -1;
      this.setupDummyRemote();
  }

  public onNewUser(e: SyncUserEvent): void {
    const user = e.accept();
    this.addUser(user);
  }

  public getState(id: string): string {
    const player = this.playerMap.get(id);
    if (!player) {
      throw Error(`Player with id ${id} not found!`);
    }
    const playerInfo = player.getInfo();
    const serverInfo = this.getServerInfo();
    const info: CombinedInfo = {...serverInfo, ...playerInfo};
    const infoString = JSON.stringify(info);
    return this.serializer(infoString,
      this.stateMask(this.state, player));
  }

  public getPlayers(): Array<Player<R>> {
    return this.users.map((id: string) => {
      const player = this.playerMap.get(id);
      if (!player) {
        throw new Error(`Player with id ${id} not found!`);
      }
      return player;
    });
  }

  public getCurrentPlayer(): Player<R> {
    return this.getPlayers()[this.getTurn() - 1];
  }

  // Gets the player number of the current player
  // Player number is one-indexed
  public getTurn(): number {
    return this.turn + 1;
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

  public waitForPlayers(): Promise<void> {
    if (this.users.length >= this.server.maxPlayers) {
      return Promise.resolve();
    }
    const holder = new PromiseHolder<void>();
    this.playerPromises.push(holder);
    return holder.promise;
  }

  public getServerInfo(): ServerInfo {
    const info: ServerInfo = {
      // Nothing by default
    };
    if (this.gameIsOver) {
      info.gameOver = this.gameOverMessage;
    }
    return info;
  }

  public gameOver(): boolean{
    return this.gameIsOver;
  }

  public endGame(message: string) {
    this.gameIsOver = true;
    this.gameOverMessage = message;
  }

  private addUser(user: SyncUser) {
    this.idMap.set(user.id, user);
    this.users.push(user.id);
    const remote = new this.remoteGenerator();
    const func = (req: string) => {
      return user.request(remoteCallId, req).result!;
    };
    setupRemote(remote, new RemoteValidator(func, this.typePath, this.cacheTypes));
    const playerNum = this.users.length;
    const player = new Player(remote, playerNum);
    this.playerMap.set(user.id, player);
    if (this.users.length >= this.server.maxPlayers) {
      for (const holder of this.playerPromises) {
        holder.resolve();
      }
    }
  }

  // Setup dummy player to enable remote validation
  // Do this before player connect because it may take some time
  private setupDummyRemote() {
    const remote = new this.remoteGenerator();
    const func = (req: string) => {
      return Promise.resolve(req);
    };
    setupRemote(remote, new RemoteValidator(func, this.typePath, this.cacheTypes));
  }
}
