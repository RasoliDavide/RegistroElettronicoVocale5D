import { Component, OnInit, Input,Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Login } from '../login-component/Login.model';
import { SharedProfDataService } from '../shared-prof-data.service';
import { ProfData } from '../prof.model';
import { Persona } from "../persona.model";
import { HttpHeaders } from '@angular/common/http';
import { Corrispondenza } from '../corrispondenze.model';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-prof-component',
  templateUrl: './prof-component.component.html',
  styleUrls: ['./prof-component.component.css']
})
export class ProfComponentComponent implements OnInit {
  datiProf: ProfData;
  datiPersona: Persona;
  @Output() loginOk : EventEmitter<Object>;
  obsProf: Observable<Object>;
  sharedProfData : SharedProfDataService;
  coordinatore: boolean;
  httpClient : HttpClient;
  router : Router;
  location : Location;
  constructor(private http: HttpClient, sharedProfData : SharedProfDataService, router : Router,  location : Location)
  {
    this.loginOk = new EventEmitter<Object>();
    this.sharedProfData = sharedProfData;
    this.httpClient = http;
    this.router = router;
    this.location = location;
  }

  ngOnInit(): void {
    this.datiProf =this.sharedProfData.profData;
    if(this.datiProf.Dirigente = true){
      this.coordinatore=false;
    }
  }



}