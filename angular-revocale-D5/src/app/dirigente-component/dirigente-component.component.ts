import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { ProfData } from '../prof.model';
import { SharedProfDataService } from '../shared-prof-data.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Comunicazione } from '../comunicazione.model';
import { Classe } from '../classe.model';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { ClassiResponse } from './classiResponse.model';

@Component({
  selector: 'app-dirigente-component',
  templateUrl: './dirigente-component.component.html',
  styleUrls: ['./dirigente-component.component.css']
})
export class DirigenteComponentComponent implements OnInit {
  formDirigente: FormGroup;
  httpClient: HttpClient;
  @Input() profData: ProfData;
  sharedProfData: SharedProfDataService;
  classi: Object[];
  obsClassi: Observable<ClassiResponse>;
  formBuilder: FormBuilder;
  constructor(fb: FormBuilder, private http: HttpClient, sharedProfData: SharedProfDataService) {
    this.httpClient = http;
    this.sharedProfData = sharedProfData;
    this.formBuilder = fb;
    this.profData = this.sharedProfData.profData;
    this.getClassi();
  }

  ngOnInit(): void {

  }

  getClassi() {
    let httpHeaders = new HttpHeaders({"Authorization": String(this.profData.securedKey)});
    this.obsClassi = this.http.get<ClassiResponse>(environment.node_server + '/api/dirigente/getAllClasses', { headers: httpHeaders });
    this.obsClassi.subscribe(
      (response) => {
        if (response.success) {

          for (let i = 0; i < response.recordSet.length; i++)
            response.recordSet[i]['selected'] = false;

          this.classi = response.recordSet;
          this.buildFormArray();
        }
        else
          alert(response);
      });
  }
  buildFormArray(): void {
    let formArray = this.classi.map((checkbox) => {
      return this.formBuilder.control(checkbox['selected']);
    });
    console.log(formArray);
    this.formDirigente = this.formBuilder.group(
      {
        'titolo': ['', Validators.required],
        'testo': ['', Validators.required],
        'destinatari': this.formBuilder.array(formArray)
      })
    console.log(this.formDirigente);
  }
  onSubmitComunicazione() {
    console.log('titolo: ', this.formDirigente.controls['titolo'].value);
    console.log('testo: ', this.formDirigente.controls['testo'].value);
    let comunicazioneOgg: Comunicazione = new Comunicazione();
    comunicazioneOgg.Titolo = this.formDirigente.controls['titolo'].value;
    comunicazioneOgg.Testo = this.formDirigente.controls['testo'].value;
    //this.formDirigente.reset();
  }
}
