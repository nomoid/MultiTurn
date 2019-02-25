export default interface TokenHandler {
  getLocalToken(): string | undefined;
  setLocalToken(token: string): void;
}
