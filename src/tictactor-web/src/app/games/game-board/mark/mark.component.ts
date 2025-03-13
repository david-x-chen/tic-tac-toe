import { Component, Input, Output, EventEmitter } from '@angular/core';
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import {faCircle} from "@fortawesome/free-regular-svg-icons";
import {BoardState} from "../../../shared/game.model";

@Component({
  selector: 'app-mark-button',
  standalone: false,
  templateUrl: './mark.component.html',
  styleUrl: './mark.component.css'
})
export class MarkComponent {
  @Input() board: BoardState;
  @Input() completed: boolean;

  @Output() moved = new EventEmitter<BoardState>();

  faCircle = faCircle;
  faXmark = faXmark;

  disableMove() {
    return this.board.State || this.completed;
  }

  buttonClicked() {
    this.moved.emit(this.board);
  }
}
