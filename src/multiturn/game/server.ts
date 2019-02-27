import PlayerSet from './playerset';

export default class Server<R, T> {
  public state: T;
  public players: PlayerSet<R>;

  private remoteGenerator: RemoteConstructor<R>;
  private mainLoop: (server: Server<R, T>) => Promise<void>;

  public constructor(
    remoteGenerator: RemoteConstructor<R>,
    mainLoop: (server: Server<R, T>) => Promise<void>,
    options: ServerOptions<T>
  ) {
    this.remoteGenerator = remoteGenerator;
    this.state = options.state;
    this.mainLoop = mainLoop;
    this.players = new PlayerSet();
  }

  public start() {
    this.remoteGenerator.setup();
    this.mainLoop.call(this.mainLoop, this);
  }
}

interface ServerOptions<T> {
  state: T;
}

interface RemoteConstructor<R> {
  setup: () => void;
  new (): R;
}
