import { Injectable } from '@angular/core';
import { ProfData } from './prof.model';

@Injectable({
  providedIn: 'root'
})
export class SharedProfDataService {
  profData : ProfData;
  selectedClass : String;
  constructor() { }
  setSelectedClass(selectedClass : String)
  {
    this.selectedClass = selectedClass;
  }
  setProfData(profData : ProfData)
  {
    this.profData = profData;
  }
}
