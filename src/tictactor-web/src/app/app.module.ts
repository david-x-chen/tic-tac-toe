import { HttpClientModule, provideHttpClient, withInterceptors} from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GamesComponent } from './games/games.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {NgxWebstorageModule} from "ngx-webstorage";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { HomeComponent } from './home/home.component';
import {appRequestsInterceptor} from "./app-requests.interceptor";
import { GameBoardComponent } from './games/game-board/game-board.component';
import { GameListComponent } from './games/game-list/game-list.component';

@NgModule({
  declarations: [
    AppComponent,
    GamesComponent,
    HomeComponent,
    GameBoardComponent,
    GameListComponent
  ],
  imports: [
    BrowserModule,
    NgxWebstorageModule.forRoot(),
    HttpClientModule,
    AppRoutingModule,
    NgbModule,
    ReactiveFormsModule,
    FormsModule
  ],
  providers: [
    provideHttpClient(withInterceptors([appRequestsInterceptor]))
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
