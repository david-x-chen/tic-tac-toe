import {provideHttpClient, withInterceptors, withInterceptorsFromDi} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {GamesComponent} from './games/games.component';
import {NgbModule, NgbAlertModule} from '@ng-bootstrap/ng-bootstrap';
import {provideNgxWebstorage, withNgxWebstorageConfig, withLocalStorage, withSessionStorage} from "ngx-webstorage";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {HomeComponent} from './home/home.component';
import {appRequestsInterceptor} from "./app-requests.interceptor";
import {GameBoardComponent} from './games/game-board/game-board.component';
import {GameListComponent} from './games/game-list/game-list.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MarkComponent } from './games/game-board/mark/mark.component';

@NgModule({
  declarations: [
    AppComponent,
    GamesComponent,
    HomeComponent,
    GameBoardComponent,
    GameListComponent,
    MarkComponent,
  ],
  bootstrap: [AppComponent],
  imports: [BrowserModule,
    AppRoutingModule,
    NgbModule,
    NgbAlertModule,
    ReactiveFormsModule,
    FormsModule,
    FontAwesomeModule],
  providers: [
    provideHttpClient(withInterceptors([appRequestsInterceptor])),
    provideHttpClient(withInterceptorsFromDi()),
    provideNgxWebstorage(
      withNgxWebstorageConfig({separator: ':', caseSensitive: true}),
      withLocalStorage(),
      withSessionStorage()
    ),
  ]
})
export class AppModule {
}
