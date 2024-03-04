import {AfterViewInit, Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {LocalStorageService} from "ngx-webstorage";
import {NgbModal, NgbModalConfig} from "@ng-bootstrap/ng-bootstrap";
import {delay, GameSummary, NameStorageKey, PairingSummary, Player} from "../shared/game.model";
import {GamesService} from "../games/games.service";
import {SignalEventType} from "../shared/signal-r.model";
import {Subscription} from "rxjs";
import {SignalRService} from "../shared/signal-r.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit {
  player : Player;
  @ViewChild('nameModalContent') nameModal: TemplateRef<any> | undefined;

  constructor(config: NgbModalConfig,
              private storageService:LocalStorageService,
              private gameService: GamesService,
              private modalService: NgbModal) {
    config.backdrop = 'static';
    config.keyboard = false;
  }

  ngOnInit() {
    this.player = this.storageService.retrieve(NameStorageKey);
    if (this.player === null) {
      this.player = { Name : '', Id: '' };
    }
  }

  ngAfterViewInit() {
    if (this.player.Name === '' && this.nameModal !== undefined) {
      this.open(this.nameModal);
    }

    delay(1000).then(() => {
      this.gameService.setPlayer(this.player);
    });
  }

  open(content: TemplateRef<any>) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result) => {
        if (result.length === 0 && this.nameModal !== undefined) {
          this.open(this.nameModal);
          return;
        }

        this.player.Name = result;
        this.player.Id = crypto.randomUUID();
        this.storageService.store(NameStorageKey, this.player);
      }
    );
  }
}
