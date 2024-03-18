import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import { Configuration } from './configuration.model';
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {

  configData = new Subject<Configuration>();
  private readonly configPath: string = './assets/config/config.json';

  constructor(private http: HttpClient) {
  }

  loadConfiguration() {
    this.http.get<Configuration>(this.configPath).subscribe(
      data => {
        this.configData.next(data);
      }
    );
  }
}
