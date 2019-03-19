export interface PlayerInfo {
  num: number;
}

export interface ServerInfo {
  turn: number;
  responseMessage?: string;
  gameOver?: string;
}

export interface CombinedInfo extends PlayerInfo, ServerInfo{

}
