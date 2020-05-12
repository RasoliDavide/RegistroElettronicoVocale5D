import { Component, OnInit, Input,Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Login } from '../login-component/Login.model';
import { SharedProfDataService } from '../shared-prof-data.service';
import { ProfData } from '../prof.model';

@Component({
  selector: 'app-prof-component',
  templateUrl: './prof-component.component.html',
  styleUrls: ['./prof-component.component.css']
})
export class ProfComponentComponent implements OnInit {
  datiProf: ProfData;
  @Output() loginOk : EventEmitter<Object>;
  obsProf: Observable<Object>;
  sharedProfData : SharedProfDataService;
  coordinatore: boolean;
  constructor(private http: HttpClient, sharedProfData : SharedProfDataService)
  {
    this.loginOk = new EventEmitter<Object>();
    this.sharedProfData = sharedProfData;
  }

  ngOnInit(): void {
    this.datiProf =this.sharedProfData.profData;
    if(this.datiProf.Dirigente = true){
      this.coordinatore=false;
    }
  }



}
