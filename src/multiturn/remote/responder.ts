export class RemoteResponder {

  private responders: Map<string, any> = new Map();

  public constructor(...responders: any) {
    for (const responder of responders) {
      this.addResponder(responder);
    }
  }

  public addResponder(responder: any) {
    const typeName = responder.constructor.name;
    console.log(`Adding responder for type ${typeName}`);
    this.responders.set(typeName, responder);
  }

  public onValidationRequest(msg: string): Promise<string> {
    try {
      const requestParts = msg.split('.');
      if (requestParts.length !== 2) {
        throw Error('Request part length incorrect');
      }
      const typeName = requestParts[0];
      const methodName = requestParts[1];
      const resp: any = this.responders.get(typeName);
      if (!resp) {
        throw Error(`No responder found for type ${typeName}`);
      }
      const respMethod = resp[methodName];
      if (respMethod && typeof respMethod === 'function') {
        const returned = respMethod();
        // Check if the returned object is a promise
        if (returned.then) {
          return returned.then((o: any) => {
            return JSON.stringify(o);
          });
        }
        else {
          return Promise.resolve(JSON.stringify(returned));
        }
      }
      else {
        throw Error(`No responder found for method ${methodName}`);
      }
    }
    catch (e) {
      // Invalid request
      console.log(`Invalid request '${msg}' with error '${e}'`);
      return Promise.reject();
    }
  }

}
