import PromiseHolder from '../helper/promiseholder';
import RemoteValidator, { setupRemote } from '../remote/validator';
import { Serializer, Deserializer } from '../sio-network/serializer';
import { StateManager, SyncUserEvent, SyncUser, ServerSyncLayer } from '../sync/server';
import Player from './player';
import Server from './server';

const assignNumId = '_assignNum';
const remoteCallId = '_remoteCall';

export default class ServerStateManager<R, T> implements StateManager {
  private idMap: Map<string, SyncUser> = new Map();
  private playerMap: Map<string, Player<R>> = new Map();
  private users: string[] = [];
  private playerPromises: Array<PromiseHolder<void>> = [];

  public constructor(private server: Server<R, T>,
    private syncLayer: ServerSyncLayer,
    private state: T, private stateMask: (state: T,
    player: Player<R>) => string, private remoteGenerator: new () => R,
    private typePath: string,
    private cacheTypes: boolean,
    private serializer: Serializer, private deserializer: Deserializer) {
      this.setupDummyRemote();
  }

  public onNewUser(e: SyncUserEvent): void {
    const user = e.accept();
    this.addUser(user);
  }

  // TODO try to fit in player meta information with state
  public getState(id: string): string {
    const player = this.playerMap.get(id);
    if (!player) {
      throw Error(`Player with id ${id} not found!`);
    }
    const playerInfo = JSON.stringify(player.getInfo());
    return this.serializer(playerInfo,
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

  public waitForPlayers(): Promise<void> {
    if (this.users.length >= this.server.maxPlayers) {
      return Promise.resolve();
    }
    const holder = new PromiseHolder<void>();
    this.playerPromises.push(holder);
    return holder.promise;
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
