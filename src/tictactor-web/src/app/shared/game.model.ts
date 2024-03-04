export class GameSummary {
  constructor(
    public State: number,
    public YourMove: boolean,
    public NumMoves: number,
    public Outcome: string,
    public NumPlayers: number,
    public GameId: string,
    public Usernames: string[],
    public Name: string,
    public GameStarter: boolean
  ) {}
}

export class GameMove {
  constructor(
    public PlayerId: string,
    public X: number,
    public Y: number,
    public State: number
  ) {}
}

export class GameServerParameters {
  constructor(
    public PlayerId: string,
    public GameId: string,
    public Move: GameMove
  ) {
  }
}

export class PairingSummary {
  constructor(
    public GameId: string,
    public Player: Player
  ) {}
}

export const NameStorageKey: string = 'tic-tac-toe-player';
export const GameStorageKey: string = 'tic-tac-toe-current-game';

export class CurrentGame {
  constructor(
    public GameId: string,
    public State: number
  ) {}
}

export class JoinGameResult {
  constructor(
    public gameState: number
  ) {}
}

export class Player {
  constructor(
    public Id: string,
    public Name: string
  ) {}
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
