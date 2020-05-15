import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Classi } from '../classi.model';
import { ProfData } from '../prof.model';
import { SharedProfDataService } from '../shared-prof-data.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Studente } from '../studente.model';
import { Assenza } from '../assenza.model';
import { Corrispondenza } from '../corrispondenze.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-assenze-component',
  templateUrl: './assenze-component.component.html',
  styleUrls: ['./assenze-component.component.css']
})
export class AssenzeComponentComponent implements OnInit {
  httpClient : HttpClient;
  obsAssenze : Observable<Object>;
  Classi: Classi;
  giustificaV = false;
  formGiustifica: FormGroup;
  formAssenza:FormGroup;
  concorreSelect : boolean;
  //studente : Studente;
  profData : ProfData;
  observAssenza: Observable<Object>;
  selectedAssenza: string = '';
  selectedStudente : Studente;
  sharedProfData : SharedProfDataService;
  observableChangeSelectedClass : Observable<Corrispondenza>;
  studenti : Studente[];
  assenze: Assenza[];
  @Output() assenzaOK : EventEmitter<Object>;
  selectedClass : Corrispondenza;
  visuaForm: boolean;

  constructor(fb: FormBuilder,private http: HttpClient, sharedProfData : SharedProfDataService)
  {
    this.httpClient = http;
    this.sharedProfData = sharedProfData;
    this.formAssenza = fb.group(
      {
        'studente':[0, Validators.required],
        'tipoAssenza' : [Validators.required],
        'data':['',Validators.required],
        'concorre':[true],
        'orario':['',Validators.required]
      }
    )

     this.formGiustifica = fb.group({
      'motivazione': ['', Validators.required]
    });
  }

  ngOnInit(): void
  {
    this.profData = this.sharedProfData.profData;
    this.observableChangeSelectedClass = this.sharedProfData.getObservable();
    this.onClassChange(this.sharedProfData.selectedClass);
    this.observableChangeSelectedClass.subscribe(selectedClass => this.onClassChange(selectedClass));
  }

  giustifica(){
    this.giustificaV  = true;
    console.log("GiustificaV = true");
  }

  selectChangeHandler (value) { //TipoAssenza
    this.selectedAssenza = value;
  }
  toggleEditable(event) {
    if ( event.target.checked ) {
         this.concorreSelect = true;
    }else{
         this.concorreSelect = false;
    }
  }

  onSubmitAssenza(value: string): void {
    console.log('Tipo Assenza: ', this.formAssenza.controls['tipoAssenza']);
    console.log('Data: ', this.formAssenza.controls['data'].value);
    console.log('Orario: ', this.formAssenza.controls['orario'].value);
    console.log('Concorre: ',this.formAssenza.controls['concorre'].value);
    let assenzaOgg: Assenza = new Assenza();
    assenzaOgg.Tipo = this.formAssenza.controls['tipoAssenza'].value;
    assenzaOgg.DataAssenza = this.formAssenza.controls['data'].value;
    assenzaOgg.Ora = this.formAssenza.controls['orario'].value;
    assenzaOgg.Concorre = this.formAssenza.controls['concorre'].value
    assenzaOgg.CFProfessore = this.profData.CFPersona;
    assenzaOgg.UsernameStudente = this.selectedStudente.Username;
    if(assenzaOgg.Tipo == "A")
      assenzaOgg.Ora = "";
    else
      assenzaOgg.Ora = this.formAssenza.controls['orario'].value;

    let httpHeaders = new HttpHeaders({"Authorization" : String(this.profData.securedKey)})
    this.observAssenza = this.http.post(environment.node_server + '/api/assenze/inserisciAssenza', assenzaOgg, {headers : httpHeaders});
    this.observAssenza.subscribe(
      (data) =>
      {
        console.log(data);
      }
    )
  }
  onSubmitGiustifica(value: string): void{
    console.log('Motivazione: ', this.formAssenza.controls['motivazione'].value);
  }

  getStudenti()
  {
    let httpHead = new HttpHeaders({Authorization : String(this.profData.securedKey)});
    this.httpClient.get<Studente[]>(environment.node_server + `/api/prof/getStudentiByClasse?codiceClasse=${this.selectedClass.CodiceClasse}`, {headers : httpHead})
    .subscribe((response) =>
    {
      this.studenti = response;
      console.log(this.studenti);
    })
  }

  getAssenze(){
    let httpHead = new HttpHeaders({Authorization : String(this.profData.securedKey)});
    this.httpClient.get<Assenza[]>(environment.node_server + `/api/assenze/getAssenzeByStudente?UsernameStudente=${this.selectedStudente.Username}`, {headers : httpHead})
    .subscribe((response) =>
    {
      this.assenze = response;
      for(let assenza of this.assenze)
      {
        assenza.DataAssenza = assenza.DataAssenza.substring(0,10);
        if(assenza.Ora != undefined)
          assenza.Ora = assenza.Ora.substring(11, 16);
        switch(assenza.Tipo)
        {
          case('A'):
            assenza.Tipo = 'Assenza';
            break;
          case('E'):
            assenza.Tipo = 'Entrata posticipata';
            break;
          case('U'):
            assenza.Tipo = 'Uscita anticipata';
            break;
        }
      }
    })
  }

  onClassChange(selectedClass : Corrispondenza)
  {
    console.log(selectedClass);
    this.selectedClass = selectedClass;
    this.studenti = null;
    this.getStudenti();
  }
  onStudentSelection(selectedStudent : Studente)
  {
    this.selectedStudente = selectedStudent;
    this.visuaForm = (typeof(this.selectedStudente) == 'object');
    if(this.visuaForm)
      this.getAssenze();
  }
}
