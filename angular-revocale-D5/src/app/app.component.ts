import { Component } from '@angular/core';
import { ProfData } from './prof.model';
import { Corrispondenze } from './corrispondenze.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SharedProfDataService } from './shared-prof-data.service';
import {MatSelectModule} from '@angular/material/select';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  selected = 'option2';
  title = 'angular-revocale-D5';
  profData : ProfData;
  httpClient : HttpClient;
  scompare: boolean;
  sharedProfData : SharedProfDataService;
  constructor(http : HttpClient, sharedProfData : SharedProfDataService)
  {
    this.httpClient = http;
    this.profData = new ProfData;
    this.scompare = false;
    this.sharedProfData = sharedProfData;
  }

  getDatiProf(profProv : Object)
  {
    console.log(profProv)
    let httpHead = new HttpHeaders({Authorization : profProv['securedKey']});
    this.httpClient.get<Corrispondenze[]>(`https://3000-fd55686c-fe67-43e1-9d74-11cde241e001.ws-eu01.gitpod.io/api/getTeachingClasses?cfProfessore=${profProv['CFPersona']}`, {headers : httpHead})
    .subscribe((response) =>
    {
      this.profData.CFPersona = profProv['CFPersona'];
      this.profData.Nome = profProv['Nome'];
      this.profData.Cognome = profProv['Cognome'];
      this.profData.CoordinaClasse = profProv['CoordinaClasse'];
      this.profData.Dirigente = profProv['Dirigente'];
      this.profData.Laboratorio = profProv['Laboratorio'];
      this.profData.securedKey = profProv['securedKey'];
      this.profData.Corrispondenze = response;
      console.log(this.profData);
      this.sharedProfData.setProfData(this.profData);
    })

  }
}
