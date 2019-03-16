import * as Cookie from 'js-cookie';
import * as logger from 'loglevel';
import TokenHandler from './token';

const log = logger.getLogger('Cookie');

const authTokenId = 'auth.token';

export default class AuthClientCookieTokenHandler implements TokenHandler {

  public getLocalToken(): string | undefined {
    const localToken = Cookie.get(authTokenId);
    if (localToken) {
      log.info(`Local token found ${localToken}`);
    }
    else {
      log.info('No local token found, requesting new token');
    }
    return localToken;
  }
  public setLocalToken(token: string): void {
    Cookie.set(authTokenId, token);
    log.info(`Setting local token ${token}`);
  }
}
