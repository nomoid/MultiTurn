declare module 'http-shutdown' {
  import { Server } from 'http';

  interface ShutdownServer extends Server {
    shutdown(callback: () => void): void;
  }
  type HttpShutdown = (server: Server) => ShutdownServer;
  let wrapper: HttpShutdown;

  export = wrapper;
}
