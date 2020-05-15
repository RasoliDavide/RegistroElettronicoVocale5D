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
  selectedOption: string;
  selectedOrario:string;
  selectedData: string;
  tipoG : string;
  tipoO : string;
  tipoD : string;
  concorreSelect : boolean;
  studente : Studente;
  profData : ProfData;
  observAssenza: Observable<Object>;
  selectedAssenza: string = '';
  selectedStudente : string = '';
  sharedProfData : SharedProfDataService;
  observableChangeSelectedClass : Observable<Corrispondenza>;
  studenti : Studente[];
  assenze: Assenza[];
  @Output() assenzaOK : EventEmitter<Object>;
  selectedClass : Corrispondenza;

  constructor(fb: FormBuilder,private http: HttpClient, sharedProfData : SharedProfDataService)
  {
    this.httpClient = http;
    this.sharedProfData = sharedProfData;
    this.formAssenza = fb.group(
      {
        'studente':[0, Validators.required],
        'data':['',Validators.required],
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
    this.getStudenti();
  }

  giustifica(){
    this.giustificaV  = true;
    console.log("GiustificaV = true");
  }
  selectChangeHandlerStudenti(value){
    this.selectedStudente = value;
    console.log('Studente selezionato: ', this.selectedStudente);
    var splitted = this.selectedStudente.split(" ");
    console.log('Studente', splitted);
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
    console.log('Tipo Assenza: ', this.selectedAssenza);
    console.log('Data: ', this.formAssenza.controls['data'].value);
    console.log('Orario: ', this.formAssenza.controls['orario'].value);
    console.log('Concorre: ',this.concorreSelect);
    let assenzaOgg: Assenza = new Assenza();
    assenzaOgg.Tipo = this.selectedAssenza;
    if(assenzaOgg.Tipo == "A"){
      assenzaOgg.Data = this.formAssenza.controls['data'].value;
      assenzaOgg.Ora = null;
      assenzaOgg.Concorre =this.concorreSelect;
      assenzaOgg.CFProfessore=this.profData.CFPersona;
    }else{
      assenzaOgg.Data = this.formAssenza.controls['data'].value;
      assenzaOgg.Ora = this.formAssenza.controls['orario'].value;
      assenzaOgg.Concorre =this.concorreSelect;
      assenzaOgg.CFProfessore=this.profData.CFPersona;
    }

   // this.observAssenza = this.http.post(environment.node_server + '/api/assenza/inserisciAssenza', assenzaOgg)
    //this.observAssenza.subscribe(
     // (data) => {
        //alert('ok');
     // this.assenzaOK.emit(data);
     // }
  //  )

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
    this.httpClient.get<Assenza[]>(environment.node_server + `/api/prof/assenze/getAssenzeByStudente?UsernameStudente=`, {headers : httpHead})
    .subscribe((response) =>
    {

     this.assenze = response;
     console.log(this.assenze);

    })
  }

  onClassChange(selectedClass : Corrispondenza)
  {
    console.log(selectedClass);
    this.selectedClass = selectedClass;
    this.studenti = null;
    this.getStudenti();
  }
}
