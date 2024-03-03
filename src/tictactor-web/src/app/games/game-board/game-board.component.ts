import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {debounceTime, Subject, Subscription, tap} from "rxjs";
import {GameMove, GameServerParameters, GameSummary, NameStorageKey, Player} from "../../shared/game.model";
import {SignalRService} from "../../shared/signal-r.service";
import {SignalEventType} from "../../shared/signal-r.model";
import {LocalStorageService} from "ngx-webstorage";
import {NgbAlert} from "@ng-bootstrap/ng-bootstrap";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {GamesService} from "../games.service";

interface BoardState {
  X: number,
  Y: number,
  State: string,
  YourMove: boolean
}

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.css'
})
export class GameBoardComponent implements OnInit, OnDestroy {
  @Input() gameId: string;
  private _message$ = new Subject<string>();
  @ViewChild('selfClosingAlert', { static: false }) selfClosingAlert: NgbAlert;

  player: Player;

  alertType = 'warning';
  notYourMoveMessage = '';
  winMessage = '';

  gameMoveSub!: Subscription;
  gameMovesSub!: Subscription;

  gameMoves: GameMove[];
  gameSummary: GameSummary = {} as GameSummary;
  board: { [id: string] : BoardState; } = {};

  constructor(private signal: SignalRService,
              private storageService: LocalStorageService,
              private gamesService: GamesService) {
    this._message$
      .pipe(
        takeUntilDestroyed(),
        tap((message) => (this.notYourMoveMessage = message)),
        debounceTime(5000),
      )
      .subscribe(() => this.selfClosingAlert?.close());
  }

  ngOnInit() {
    const player = this.storageService.retrieve(NameStorageKey);
    if (player == null) {
      return;
    }

    this.player = player;

    for (let x: number = 0; x < 3; x++) {
      for (let y: number = 0; y < 3; y++) {
        this.board[`x${x}y${y}`] = { X: x, Y: y, State: '', YourMove: false };
      }
    }

    this.gameMovesSub = this.signal
      .getDataStream<[GameMove[], GameSummary]>(SignalEventType.GAME_MOVES)
      .subscribe(message => {
        this.gameMoves = message.data[0];
        this.gameSummary = message.data[1];

        const that = this;

        if (this.gameSummary.State == 2 && this.winMessage == '') {
          this.winMessage = `The winner: ${this.gameSummary.Usernames[0]}`;
        }

        for (let x: number = 0; x < 3; x++) {
          for (let y: number = 0; y < 3; y++) {
            this.board[`x${x}y${y}`].YourMove = this.gameSummary.YourMove;
          }
        }

        let useO: boolean = true;
        this.gameMoves.forEach(function(move) {
          that.board[`x${move.X}y${move.Y}`].State = useO ? 'O' : 'X';
          useO = !useO;
        });
      }
    );

    this.gameMoveSub = this.signal
      .getDataStream<GameMove>(SignalEventType.GAME_MOVE)
      .subscribe(message => {
        console.log(message);
        const move = message.data;
        if (move.State == 2) {
          this.winMessage =
            move.PlayerId != this.player.Id
              ? `The winner: ${this.gameSummary.Usernames[0]}`
              : 'You win!';
        }
      });
  }

  move(state: BoardState) {
    if (state.State) {
      this.alertType = 'danger';
      this._message$.next("Please act on the empty slot.");
      return;
    }

    if (!state.YourMove) {
      this.alertType = 'warning';
      this._message$.next("Not your move yet");
      return;
    }

    const params: GameServerParameters = {
      PlayerId: this.player.Id,
      GameId: this.gameId,
      Move: {
        PlayerId: this.player.Id,
        X: state.X,
        Y: state.Y,
        State: 0
      }
    }
    this.signal.invokeServerMethod(params, SignalEventType.GAME_MOVE).then(() => {});
  }

  showGames() {
    this.gamesService.showGameList();

    const params: GameServerParameters = {
      PlayerId: this.player.Id,
      GameId: this.gameId,
      Move: { } as GameMove
    }
    this.signal.invokeServerMethod(params, SignalEventType.GAME_INFO).then(()=>{});
  }

  ngOnDestroy() {
    this.gameMoveSub.unsubscribe();
    this.gameMovesSub.unsubscribe();
  }
}
