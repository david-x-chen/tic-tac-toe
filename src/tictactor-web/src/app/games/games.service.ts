import { Injectable } from '@angular/core';
import {
  CurrentGame, GameMove, GameServerParameters,
  GameStorageKey,
  GameSummary,
  JoinGameResult,
  NameStorageKey,
  PairingSummary,
  Player
} from "../shared/game.model";
import {Subject} from "rxjs";
import cryptoRandomString from "crypto-random-string";
import {HttpClient} from "@angular/common/http";
import {LocalStorageService, SessionStorageService} from "ngx-webstorage";
import {SignalEventType} from "../shared/signal-r.model";
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

  constructor(private http: HttpClient,
              private signal: SignalRService,
              private storageService:LocalStorageService,
              private sessionService:SessionStorageService) { }

  generate(length = 32): string {
    return cryptoRandomString({length: length});
  }

  setPlayer(player: Player) {
    if (player === null || player.Id === '') {
      return;
    }

    this.http.post('/api/game/set-player/', player).subscribe(
      () => {}
    );
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

  createGame() {
    const player = this.storageService.retrieve(NameStorageKey);
    this.http.post('/api/game/create-game', player).subscribe(
      () => {}
    );
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
