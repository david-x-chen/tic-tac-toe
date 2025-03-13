import { Injectable } from '@angular/core';
import {
  CurrentGame,
  GameStorageKey,
  GameSummary,
  JoinGameResult,
  NameStorageKey, NewGame,
  PairingSummary,
  Player, ResultModel
} from "../shared/game.model";
import {Subject, Observable} from "rxjs";
import cryptoRandomString from "crypto-random-string";
import { HttpClient } from "@angular/common/http";
import {LocalStorageService, SessionStorageService} from "ngx-webstorage";
import {SignalRService} from "../shared/signal-r.service";

@Injectable({
  providedIn: 'root'
})
export class GamesService {
  currentGames: GameSummary[] = [];
  availableGames: PairingSummary[] = [];

  currentGamesChanged = new Subject<GameSummary[]>();
  availableGamesChanged = new Subject<PairingSummary[]>();

  currentGame = new Subject<CurrentGame>();
  returnToGameList = new Subject<boolean>();

  constructor(private readonly http: HttpClient,
              private readonly signal: SignalRService,
              private readonly storageService:LocalStorageService,
              private readonly sessionService:SessionStorageService) { }

  generate(length = 32): string {
    return cryptoRandomString({length: length});
  }

  setPlayer(player: Player):Observable<ResultModel> {
    return this.http.post<ResultModel>('/api/game/set-player/', player);
  }

  getGames() {
    const rand = this.generate();
    this.http.get<[GameSummary[], PairingSummary[]]>(`/api/game/get-games?r=${rand}`).subscribe(
      (result) => {
        this.currentGames = result[0];
        this.availableGames = result[1];

        this.currentGamesChanged.next(this.currentGames);
        this.availableGamesChanged.next(this.availableGames);
      }
    );
  }

  createGame():Observable<NewGame> {
    const player = this.storageService.retrieve(NameStorageKey);
    return this.http.post<NewGame>('/api/game/create-game', player)
  }

  joinGame(gameId: string) {
    this.http.post<JoinGameResult>(`/api/game/join-game/${gameId}`, {}).subscribe(
      result => {
        const currentGame: CurrentGame = {
          GameId: gameId,
          State: result.gameState
        };
        this.sessionService.store(GameStorageKey, currentGame);
      }
    );
  }

  play(gameId: string) {
    this.currentGame.next({ GameId: gameId, State: 1});
  }

  showGameList() {
    this.returnToGameList.next(true);
  }
}
