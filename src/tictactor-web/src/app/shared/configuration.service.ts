import { Injectable } from '@angular/core';
import { Configuration } from './configuration.model';
import {Subject} from "rxjs";
import * as config from '../../assets/config/config.json';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {

  configData = new Subject<Configuration>();

  constructor() {
  }

  loadConfiguration() {
    const data:Configuration = config;

    this.configData.next(data);
  }
}
