import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {debounceTime, Subject, Subscription, tap} from "rxjs";
import {
  BoardState,
  GameMove,
  GameMoves,
  GameServerParameters,
  GameSummary,
  NameStorageKey,
  Player
} from "../../shared/game.model";
import {SignalRService} from "../../shared/signal-r.service";
import {SignalEventType} from "../../shared/signal-r.model";
import {LocalStorageService} from "ngx-webstorage";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {GamesService} from "../games.service";
import {faArrowAltCircleLeft, faXmark} from "@fortawesome/free-solid-svg-icons";
import {faCircle} from "@fortawesome/free-regular-svg-icons";

@Component({
    selector: 'app-game-board',
    templateUrl: './game-board.component.html',
    styleUrl: './game-board.component.css',
    standalone: false
})
export class GameBoardComponent implements OnInit, OnDestroy {
  @Input() gameId: string;
  private readonly msgSub = new Subject<string>();

  showAlertMessage = false;

  faArrowAltCircleLeft = faArrowAltCircleLeft;
  faCircle = faCircle;
  faXmark = faXmark;

  board_rows = Array.from(Array(3),(x,i)=>i);
  board_cols = Array.from(Array(3),(x,i)=>i);

  player: Player;

  alertType = 'warning';
  notYourMoveMessage = '';
  winMessage = '';
  youWin = false;

  gameMoveSub!: Subscription;
  gameMovesSub!: Subscription;

  gameMoves: GameMove[];
  gameSummary: GameSummary = {} as GameSummary;
  board: { [id: string] : BoardState; } = {};

  constructor(private readonly signal: SignalRService,
              private readonly storageService: LocalStorageService,
              private readonly gamesService: GamesService) {
    this.msgSub
      .pipe(
        takeUntilDestroyed(),
        tap((message) => (this.notYourMoveMessage = message)),
        debounceTime(5000),
      )
      .subscribe(() => {
        this.showAlertMessage = !this.showAlertMessage;
        this.notYourMoveMessage = '';
      });
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
      .getDataStream<GameMoves>(SignalEventType.GAME_MOVES)
      .subscribe(message => {
        this.gameMoves = message.data.Moves;
        this.gameSummary = message.data.Summary;

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
        const move = message.data;
        if (move.State == 2) {
          this.winMessage =
            move.PlayerId != this.player.Id
              ? `The winner: ${this.gameSummary.Usernames[0]}`
              : 'You win!';

          this.youWin = move.PlayerId === this.player.Id;
        }
      });
  }

  setBoard(col: number, row: number) {
    return `x${row}y${col}`;
  }

  move(state: BoardState) {
    if (state.State) {
      this.alertType = 'danger';
      this.msgSub.next("Please act on the empty slot.");
      return;
    }

    if (!state.YourMove) {
      this.alertType = 'warning';
      this.showAlertMessage = !this.showAlertMessage;
      this.msgSub.next("Not your move yet");
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

  disableMove(state: BoardState) {
    return state.State || this.winMessage;
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
