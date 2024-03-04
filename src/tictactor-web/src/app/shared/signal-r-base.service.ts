import {Injectable} from "@angular/core";
import {SignalEvent, SignalEventType} from "./signal-r.model";
import {Observable} from "rxjs";
import {GameServerParameters} from "./game.model";

@Injectable({
  providedIn: 'root'
})
export abstract class SignalRBaseService {
  abstract getDataStream<TDataShape>(...filterValues: SignalEventType[])
    : Observable<SignalEvent<TDataShape>>

  abstract invokeServerMethod(serverParameters: GameServerParameters, eventType: SignalEventType)
    : Promise<boolean>
}
