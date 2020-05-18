import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ProfData } from '../prof.model';
import { SharedProfDataService } from '../shared-prof-data.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Corrispondenza } from '../corrispondenze.model';
import { Firma } from '../firma.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-firma-component',
  templateUrl: './firma-component.component.html',
  styleUrls: ['./firma-component.component.css']
})
export class FirmaComponentComponent implements OnInit {
  formFirma: FormGroup;
  httpClient : HttpClient;
  @Input() profData : ProfData;
  sharedProfData : SharedProfDataService;
  observableChangeSelectedClass : Observable<Corrispondenza>;
  selectedClass : Corrispondenza;
  visuaForm: boolean;
  firme:Firma[];
  observFirma: Observable<Object>;

  constructor(fb : FormBuilder,private http: HttpClient, sharedProfData : SharedProfDataService) {
    this.httpClient = http;
    this.sharedProfData = sharedProfData;
    this.formFirma = fb.group(
    {
      'data':['',Validators.required],
      'ora':['',Validators.required],
      'argomento':['',Validators.required],
      'compiti':['']
    })

  }

  ngOnInit(): void {
    this.profData = this.sharedProfData.profData;
    this.observableChangeSelectedClass = this.sharedProfData.getObservable();
    this.onClassChange(this.sharedProfData.selectedClass);
    this.observableChangeSelectedClass.subscribe(selectedClass => this.onClassChange(selectedClass));
    this.getFirme();
  }

  onSubmitFirma(){
      console.log('Data: ', this.formFirma.controls['data'].value);
      console.log('Ora: ', this.formFirma.controls['ora'].value);
      console.log('Argomento: ', this.formFirma.controls['argomento'].value);
      console.log('Compiti: ', this.formFirma.controls['compiti'].value);
      //CFProfessore, CodiceClasse, DataFirma, Ora, Argomento, CompitiAssegnati, CodiceMateria
      let firmaOgg:Firma = new Firma();
      firmaOgg.CFProfessore =this.profData.CFPersona;
      firmaOgg.CodiceClasse = this.selectedClass.CodiceClasse;
      firmaOgg.CodiceMateria =this.selectedClass.CodiceMateria;
      firmaOgg.DataFirma = this.formFirma.controls['data'].value;
      firmaOgg.Ora = this.formFirma.controls['ora'].value;
      firmaOgg.Argomento = this.formFirma.controls['argomento'].value;
      firmaOgg.CompitiAssegnati = this.formFirma.controls['compiti'].value;

      let httpHeaders = new HttpHeaders({"Authorization" : String(this.profData.securedKey)})
      this.observFirma = this.http.post(environment.node_server + '/api/prof/firma', firmaOgg, {headers : httpHeaders});
      this.observFirma.subscribe(
      (response) =>
      {
        console.log(response);
        this.firme.push(firmaOgg);
      }
    )
    this.formFirma.reset();

  }
   onClassChange(selectedClass : Corrispondenza)
  {
    console.log(selectedClass);
    this.selectedClass = selectedClass;
    this.visuaForm = false;
  }

  getFirme(){
    let httpHead = new HttpHeaders({Authorization : String(this.profData.securedKey)});
    this.httpClient.get<Firma[]>(environment.node_server + `/api/prof/getFirme`, {headers : httpHead})
    .subscribe((response) =>
    {
      this.firme = response['recordSet'];
      for(let firma of this.firme)
      {
        firma.DataFirma = firma.DataFirma.substring(0,10);
      }
      console.log(this.firme);
    }
  )}
}
