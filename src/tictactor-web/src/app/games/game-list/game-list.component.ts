import {Component, OnDestroy, OnInit, TemplateRef} from '@angular/core';
import {Subscription} from "rxjs";
import {GameMove, GameServerParameters, GameSummary, NameStorageKey, PairingSummary} from "../../shared/game.model";
import {GamesService} from "../games.service";
import {LocalStorageService} from "ngx-webstorage";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {SignalRService} from "../../shared/signal-r.service";
import {SignalEventType} from "../../shared/signal-r.model";

@Component({
  selector: 'app-game-list',
  templateUrl: './game-list.component.html',
  styleUrl: './game-list.component.css'
})
export class GameListComponent implements OnInit, OnDestroy{
  gameSub!: Subscription;
  gameId: string;
  playerId: string;
  inviteLink: string;
  currentGames: GameSummary[] = [];
  availableGames: PairingSummary[] = [];

  constructor(private gameService: GamesService,
              private storageService:LocalStorageService,
              private modalService: NgbModal,
              private signal: SignalRService) {
  }

  ngOnInit() {
    const player = this.storageService.retrieve(NameStorageKey);
    if (player === null) {
      return;
    }

    this.playerId = player.Id;

    this.gameSub = this.signal
      .getDataStream<[string, GameSummary[], PairingSummary[]]>(SignalEventType.GAME_INFO)
      .subscribe(message =>
      {
        if (this.playerId !== message.data[0]) {
          return;
        }

        this.currentGames = message.data[1];
        this.availableGames = message.data[2];
      });
  }

  showInvite(gameId: string, content: TemplateRef<any>) {
    this.gameId = gameId;
    this.inviteLink = window.location.origin + "/Home/Join/" + this.gameId;
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result) => {},
      (reason) => {},
    );
  }

  createGame() {
    this.gameService.createGame();
  }

  play(gameId: string) {
    this.gameService.play(gameId);

    const params: GameServerParameters = {
      PlayerId: this.playerId,
      GameId: gameId,
      Move: { } as GameMove
    }
    this.signal.invokeServerMethod(params, SignalEventType.GAME_MOVES).then(()=>{});
  }

  joinThisGame(gameId: string) {
    this.gameService.joinGame(gameId);
  }

  showJoinDialog(content: TemplateRef<any>) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result) => {
        this.gameService.joinGame(result);
      },
      (reason) => {},
    );

  }

  ngOnDestroy() {
    this.gameSub.unsubscribe();
  }
}
