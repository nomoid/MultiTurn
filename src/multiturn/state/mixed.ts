import IndividualStateManager from './individual';
export default class MixedStateManager extends IndividualStateManager{

  public constructor(private globalState: string, localState: string) {
    super(localState);
  }

  public setGlobalState(state: string) {
    this.globalState = state;
  }

  public getState(id: string): string {
    return JSON.stringify(this.getStateObj(id));
  }

  public getStateObj(id: string): StateObj {
    const stateObj = {
      global: this.globalState,
      local: super.getState(id)
    };
    return stateObj;
  }

}

export interface StateObj {
  global: string;
  local: string;
}
