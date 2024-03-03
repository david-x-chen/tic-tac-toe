import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {CurrentGame, GameStorageKey} from "../shared/game.model";
import {GamesService} from "./games.service";

@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrl: './games.component.css'
})
export class GamesComponent implements OnInit, OnDestroy {
  currentGameSub!: Subscription;
  showGameListSub!: Subscription;
  currentGame: CurrentGame = { GameId: '', State: 0};

  constructor(private gameService: GamesService) {}

  ngOnInit() {
    this.currentGameSub = this.gameService.currentGame
      .subscribe((CurrentGame) => {
        this.currentGame = CurrentGame;
      });

    this.showGameListSub = this.gameService.returnToGameList
      .subscribe(() => {
        this.currentGame = {} as CurrentGame;
      })
  }

  ngOnDestroy() {
    this.currentGameSub.unsubscribe();
    this.showGameListSub.unsubscribe();
  }
}
