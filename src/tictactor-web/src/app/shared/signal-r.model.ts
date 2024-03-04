
export enum SignalEventType {
  MESSAGE,
  GAME_INFO,
  GAME_MOVE,
  GAME_MOVES,
  VERSION,
  ONLINE_PLAYERS
}

export interface SignalEvent<TDataShape> {
  type: SignalEventType,
  data: TDataShape
}
