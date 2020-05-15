import { Component, OnInit, Input,Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Login } from '../login-component/Login.model';
import { SharedProfDataService } from '../shared-prof-data.service';
import { ProfData } from '../prof.model';
import { Persona } from "../persona.model";
import { HttpHeaders } from '@angular/common/http';
import { Corrispondenza } from '../corrispondenze.model';
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

  constructor(private http: HttpClient, sharedProfData : SharedProfDataService)
  {
    this.loginOk = new EventEmitter<Object>();
    this.sharedProfData = sharedProfData;
    this.httpClient = http;
  }

  ngOnInit(): void {
    this.datiProf =this.sharedProfData.profData;
    if(this.datiProf.Dirigente = true){
      this.coordinatore=false;
    }
  }
  getDatiPersona(datiP: Object){
    let httpHead = new HttpHeaders({Authorization : datiP['securedKey']});
    this.httpClient.get<Persona[]>(`https://3000-fd55686c-fe67-43e1-9d74-11cde241e001.ws-eu01.gitpod.io/api/prof/getCFStudenteByUsername?username=${datiP['CFPersona']}`, {headers : httpHead})
    .subscribe((response) =>
    {
      /*this.datiPersona.CF = profAgg['CF'];
      this.datiPersona.Nome = profAgg['Nome'];
      this.datiPersona.Cognome = profAgg['Cognome'];
      this.datiPersona.Sesso = profAgg['Sesso'];
      this.datiPersona.DataNascita = profAgg['DataNascita'];
      this.datiPersona.Username = profAgg['Username'];
      this.datiPersona.securedKey = profAgg['securedKey'];
      //this.datiPersona.Persona = response;
      console.log(this.datiPersona);
      //this.sharedProfData.setProfData(this.profData);
      //this.sharedProfData.setSelectedClass(this.sharedProfData.profData.Corrispondenze[0]);*/
    });
  }
  /*getDatiAggProf(profAgg : Object)
  {
    let httpHead = new HttpHeaders({Authorization : profAgg['securedKey']});
    this.httpClient.get<Persona[]>(`https://3000-fd55686c-fe67-43e1-9d74-11cde241e001.ws-eu01.gitpod.io/api/prof/getTeachingClasses?cfProfessore=${profAgg['CFPersona']}`, {headers : httpHead})
    .subscribe((response) =>
    {
      this.datiPersona.CF = profAgg['CF'];
      this.datiPersona.Nome = profAgg['Nome'];
      this.datiPersona.Cognome = profAgg['Cognome'];
      this.datiPersona.Sesso = profAgg['Sesso'];
      this.datiPersona.DataNascita = profAgg['DataNascita'];
      this.datiPersona.Username = profAgg['Username'];
      this.datiPersona.securedKey = profAgg['securedKey'];
      //this.datiPersona.Persona = response;
      console.log(this.datiPersona);
      //this.sharedProfData.setProfData(this.profData);
      //this.sharedProfData.setSelectedClass(this.sharedProfData.profData.Corrispondenze[0]);
    });

  }
*/


}
