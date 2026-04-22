import { Injectable } from '@angular/core';
import { ApiService } from 'app/shared/services/api.service';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class CatalogSelectService {
  /**
   * Behavior Subjects
   */
  public onItemsChange = new BehaviorSubject([]);
  
  /**
   * Constructor
   * @param _api ApiService 
   */
  constructor(private _api: ApiService) {
  }

  getAll(apiController: string) {
    this._api.get(apiController, this.onItemsChange);
  }
}