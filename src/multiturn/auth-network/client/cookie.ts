import * as Cookie from 'js-cookie';
import TokenHandler from './token';

const verbose = true;
const authTokenId = 'auth.token';

export default class AuthClientCookieTokenHandler implements TokenHandler {

  public getLocalToken(): string | undefined {
    const localToken = Cookie.get(authTokenId);
    if (verbose) {
      if (localToken) {
        console.log(`Local token found ${localToken}`);
      }
      else {
        console.log('No local token found, requesting new token');
      }
    }
    return localToken;
  }
  public setLocalToken(token: string): void {
    Cookie.set(authTokenId, token);
    if (verbose) {
      console.log(`Setting local token ${token}`);
    }
  }
}
