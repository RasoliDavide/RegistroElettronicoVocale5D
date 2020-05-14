import { Injectable } from '@angular/core';
import { ProfData } from './prof.model';
import { Corrispondenza } from './corrispondenze.model';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedProfDataService {
  profData : ProfData;
  selectedClass : Corrispondenza;
  sendClassChange :Subject<Corrispondenza>;
  constructor() {
    this.sendClassChange = new Subject<Corrispondenza>();
  }
  setSelectedClass(selectedClass : Corrispondenza)
  {
    this.selectedClass = selectedClass;
    this.sendClassChange.next(this.selectedClass);
  }
  setProfData(profData : ProfData)
  {
    this.profData = profData;
  }
  getObservable() : Observable<Corrispondenza>
  {
    return this.sendClassChange.asObservable();
  }
}
