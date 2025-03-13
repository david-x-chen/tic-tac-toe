import {AfterViewInit, Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {LocalStorageService} from "ngx-webstorage";
import {NgbModal, NgbModalConfig} from "@ng-bootstrap/ng-bootstrap";
import {NameStorageKey, Player, ResultModel} from "../shared/game.model";
import {GamesService} from "../games/games.service";
import {ConfigurationService} from "../shared/configuration.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  standalone: false
})
export class HomeComponent implements OnInit, AfterViewInit {
  player: Player;
  @ViewChild('nameModalContent') nameModal: TemplateRef<any> | undefined;

  constructor(config: NgbModalConfig,
              private readonly storageService: LocalStorageService,
              private readonly gameService: GamesService,
              private readonly modalService: NgbModal,
              private readonly configService: ConfigurationService) {
    config.backdrop = 'static';
    config.keyboard = false;
  }

  ngOnInit() {
    this.player = this.storageService.retrieve(NameStorageKey);
    if (this.player === null) {
      this.player = {Name: '', Id: ''};
    }
  }

  ngAfterViewInit() {
    if (this.player.Name === '' && this.nameModal !== undefined) {
      this.open(this.nameModal);

      return;
    }

    this.loadGameList();
  }

  open(content: TemplateRef<any>) {
    this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'}).result.then(
      (result) => {
        if (result.length === 0 && this.nameModal !== undefined) {
          this.open(this.nameModal);
          return;
        }

        this.player.Name = result;
        this.player.Id = crypto.randomUUID();
        this.storageService.store(NameStorageKey, this.player);

        this.loadGameList();
      }
    );
  }

  loadGameList() {
    this.gameService.setPlayer(this.player).subscribe({
      next: (data: ResultModel) => {
        if (!data.succeed) {
          return;
        }

        this.configService.loadConfiguration();
      }
    });
  }
}
