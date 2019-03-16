import * as Cookie from 'js-cookie';
import * as logger from 'loglevel';
import TokenHandler from './token';

const log = logger.getLogger('Cookie');

const authTokenId = 'auth.token';

export function defaultGetLocalToken(): string | undefined {
  const localToken = Cookie.get(authTokenId);
  if (localToken) {
    log.info(`Local token found ${localToken}`);
  }
  else {
    log.info('No local token found, requesting new token');
  }
  return localToken;
}

export function defaultSetLocalToken(token: string): void{
  Cookie.set(authTokenId, token);
  log.info(`Setting local token ${token}`);
}

export default class AuthClientCookieTokenHandler implements TokenHandler {

  public getLocalToken(): string | undefined {
    return defaultGetLocalToken();
  }
  public setLocalToken(token: string): void {
    defaultSetLocalToken(token);
  }
}
