import { Injectable } from '@angular/core';
import {SignalRBaseService} from "./signal-r-base.service";
import {filter, Observable, Subject} from 'rxjs';
import { SignalEventType, SignalEvent } from './signal-r.model';
import {HubConnection, HubConnectionBuilder} from "@microsoft/signalr";
import {MessagePackHubProtocol} from "@microsoft/signalr-protocol-msgpack";
import {GameServerParameters, NameStorageKey} from "./game.model";
import {LocalStorageService} from "ngx-webstorage";
import configure from "../../assets/config/config.json";
import {HttpClient} from "@angular/common/http";

// https://stackoverflow.com/questions/68041867/can-you-inject-signalr-in-angular-10-in-a-service-without-calling-the-methods-i
@Injectable({
  providedIn: 'root'
})
export class SignalRService extends SignalRBaseService {
  private _signalEvent: Subject<SignalEvent<any>>;
  private _openConnection: boolean = false;
  private _isInitializing: boolean = false;
  private _hubConnection!: HubConnection

  config = {
    ApiUrl: configure.apiServer.url,
  };

  constructor(private storageService:LocalStorageService,
              private http: HttpClient) {
    super();

    this.getJSON().subscribe((data) => {
      this.config.ApiUrl = data.apiServer.url;

      this._signalEvent = new Subject<any>();
      this._isInitializing = true;
      this._initializeSignalR();
    });
  }

  public getJSON(): Observable<any> {
    return this.http.get('./assets/config/config.json');
  }

  override getDataStream<TDataShape>(...filterValues: SignalEventType[])
    : Observable<SignalEvent<TDataShape>> {
    this._ensureConnection();
    return this._signalEvent.asObservable().pipe(
      filter(event =>
        filterValues.some(f => f === event.type)));
  }

  override async invokeServerMethod(serverParameters: GameServerParameters, eventType: SignalEventType)
    : Promise<boolean> {
    this._ensureConnection();

    try {
      switch (eventType) {
        case SignalEventType.GAME_INFO:
          await this._hubConnection.invoke("SendGameInfo", serverParameters.PlayerId);
          break;
        case SignalEventType.GAME_MOVE:
          await this._hubConnection.invoke("SendGameMoveState", serverParameters.GameId, serverParameters.Move);
          break;
        case SignalEventType.GAME_MOVES:
          await this._hubConnection.invoke("SendGameMoves", serverParameters.PlayerId, serverParameters.GameId);
          break;
      }
    } catch (err) {
      console.error(err);
    }

    return true;
  }

  private _ensureConnection() {
    if (this._openConnection || this._isInitializing) return;
    this._initializeSignalR();
  }

  private _initializeSignalR() {
    const player = this.storageService.retrieve(NameStorageKey);
    if (player == null) {
      return;
    }

    this._hubConnection = new HubConnectionBuilder()
      .withUrl(`${this.config.ApiUrl}/message?playerId=${player.Id}`)
      .configureLogging("Warning")
      .withHubProtocol(new MessagePackHubProtocol())
      .withAutomaticReconnect()
      .build();
    this._hubConnection.start()
      .then(_ => {
        this._openConnection = true;
        this._isInitializing = false;
        this._setupSignalREvents()
      })
      .catch(error => {
        console.warn(error);
        this._hubConnection.stop().then(_ => {
          this._openConnection = false;
        })
      });

  }

  private _setupSignalREvents() {
    this._hubConnection.on('ReceiveVersion', (data) => {
      // map or transform your data as appropriate here:
      this._onMessage({type: SignalEventType.VERSION, data});
    });
    this._hubConnection.on('ReceiveMessage', (data) => {
      // map or transform your data as appropriate here:
      this._onMessage({type: SignalEventType.MESSAGE, data});
    });
    this._hubConnection.on('ReceiveGameInfo', (data) => {
      // map or transform your data as appropriate here:
      this._onMessage({type: SignalEventType.GAME_INFO, data: data});
    });
    this._hubConnection.on('ReceiveGameMove', (data) => {
      // map or transform your data as appropriate here:
      this._onMessage({type: SignalEventType.GAME_MOVE, data: data});
    });
    this._hubConnection.on('ReceiveGameMoves', (data) => {
      // map or transform your data as appropriate here:
      this._onMessage({type: SignalEventType.GAME_MOVES, data: data});
    });
    this._hubConnection.on('OnlinePlayers', (data) => {
      // map or transform your data as appropriate here:
      this._onMessage({type: SignalEventType.ONLINE_PLAYERS, data: data});
    });
    this._hubConnection.onclose((e) => this._openConnection = false);
  }

  private _onMessage<TDataShape>(payload: SignalEvent<TDataShape>) {
    this._signalEvent.next(payload);
  }
}
