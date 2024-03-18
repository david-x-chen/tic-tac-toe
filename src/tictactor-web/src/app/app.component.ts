import {Component, OnDestroy, OnInit} from '@angular/core';
import {NameStorageKey, Player} from "./shared/game.model";
import {LocalStorageService} from "ngx-webstorage";
import {Subscription} from "rxjs";
import {SignalEventType} from "./shared/signal-r.model";
import {SignalRService} from "./shared/signal-r.service";
import {ConfigurationService} from "./shared/configuration.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  versionSub!: Subscription;
  onlineSub!: Subscription;
  fileVersion = 'v1.0';
  player : Player;
  onlinePlayers: number = 0;

  constructor(private storageService:LocalStorageService,
              private signal: SignalRService,
              private config: ConfigurationService) {}

  ngOnInit() {
    this.config.loadConfiguration();

    this.player = this.storageService.retrieve(NameStorageKey);
    if (this.player === null) {
      this.player = { Name : '', Id: '' };
    }

    this.storageService.observe(NameStorageKey)
      .subscribe((value) => {
        this.player = value;
      });

    this.versionSub = this.signal
      .getDataStream<string>(SignalEventType.VERSION)
      .subscribe(message =>
      {
        this.fileVersion = `v${message.data}`;
      });

    this.onlineSub = this.signal
      .getDataStream<number>(SignalEventType.ONLINE_PLAYERS)
      .subscribe(message =>
      {
        this.onlinePlayers = message.data;
      });
  }

  ngOnDestroy() {
    this.versionSub.unsubscribe();
    this.onlineSub.unsubscribe();
  }
}
