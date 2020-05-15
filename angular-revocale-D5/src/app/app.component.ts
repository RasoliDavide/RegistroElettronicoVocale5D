import { Component } from '@angular/core';
import { ProfData } from './prof.model';
import { Corrispondenza } from './corrispondenze.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SharedProfDataService } from './shared-prof-data.service';
import {MatSelectModule} from '@angular/material/select';
import { environment } from 'src/environments/environment';

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
  selectedClass : Corrispondenza;
  constructor(http : HttpClient, sharedProfData : SharedProfDataService)
  {
    this.httpClient = http;
    this.profData = new ProfData;
    this.scompare = false;
    this.sharedProfData = sharedProfData;
  }

  getDatiProf(profProv : Object)
  {
    let httpHead = new HttpHeaders({Authorization : profProv['securedKey']});
    this.httpClient.get<Corrispondenza[]>(environment.node_server + `/api/prof/getTeachingClasses?cfProfessore=${profProv['CFPersona']}`, {headers : httpHead})
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
      this.sharedProfData.setProfData(this.profData);
      this.selectedClass = this.profData.Corrispondenze[0];
      console.log(this.profData);
      this.sharedProfData.setSelectedClass(this.sharedProfData.profData.Corrispondenze[0]);
    });

  }

  onClassSelection(selectedClass : Corrispondenza)
  {
    //console.log(selectedClass);
    this.sharedProfData.setSelectedClass(selectedClass);
  }
}
