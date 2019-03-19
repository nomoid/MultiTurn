export interface PlayerInfo {
  num: number;
}

export interface ServerInfo {
  responseMessage?: string;
  gameOver?: string;
}

export interface CombinedInfo extends PlayerInfo, ServerInfo{

}
