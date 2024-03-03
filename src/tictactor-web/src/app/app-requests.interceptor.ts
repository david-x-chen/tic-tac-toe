import { HttpInterceptorFn } from '@angular/common/http';
import {NameStorageKey, Player} from "./shared/game.model";
import {inject} from "@angular/core";
import {LocalStorageService} from "ngx-webstorage";

export const appRequestsInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(LocalStorageService);
  const player: Player = storageService.retrieve(NameStorageKey);

  if (player == null) {
    return next(req);
  }

  const updatedReq = req.clone({
    headers: req.headers.set("x-player-id", player.Id),
  });
  return next(updatedReq);
};
