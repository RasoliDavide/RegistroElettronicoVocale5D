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
  @Input() profData : ProfData;
  @Input() studente : Studente;
  observAssenza: Observable<Object>;
  selectedAssenza: string = '';
  sharedProfData : SharedProfDataService;
  observableChangeSelectedClass : Observable<Corrispondenza>;
  @Output() assenzaOK : EventEmitter<Object>;
  constructor(fb: FormBuilder,private http: HttpClient, sharedProfData : SharedProfDataService)
  {
    this.httpClient = http;
    this.sharedProfData = sharedProfData;
    this.formAssenza = fb.group(
      {
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
    this.observableChangeSelectedClass.subscribe((selectedClass) => {this.metodoCallback(selectedClass)});

  }

  giustifica(){
    this.giustificaV  = true;
    console.log("GiustificaV = true");
  }
  selectChangeHandler (event: any) {
    this.selectedAssenza = event.target.value;
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
      assenzaOgg.CFStudente = this.studente.CFStudente;
      assenzaOgg.CFProfessore=this.profData.CFPersona;
    }else{
      assenzaOgg.Data = this.formAssenza.controls['data'].value;
      assenzaOgg.Ora = this.formAssenza.controls['orario'].value;
      assenzaOgg.Concorre =this.concorreSelect;
      assenzaOgg.CFStudente = this.studente.CFStudente;
      assenzaOgg.CFProfessore=this.profData.CFPersona;
    }

   // this.observAssenza = this.http.post('https://3000-fd55686c-fe67-43e1-9d74-11cde241e001.ws-eu01.gitpod.io/api/inserisciAssenza', a)
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

  getStudenti(studente : Object)
  {
    console.log(studente)
    let httpHead = new HttpHeaders({Authorization : studente['securedKey']});
    this.httpClient.get<Studente[]>(`https://3000-fd55686c-fe67-43e1-9d74-11cde241e001.ws-eu01.gitpod.io/api/getStudentiByClasse?codiceClasse=${studente['CodiceClasse']}`, {headers : httpHead})
    .subscribe((response) =>
    {
      //Cognome,Nome,Username
      this.studente.Cognome = studente['Cognome'];
      this.studente.Nome = studente['Nome'];
      this.studente.Username = studente['Username'];
      this.studente.CFStudente = studente['CFStudente'];

    })
  }
  metodoCallback(qualcosa : Object)
  {
    console.log(qualcosa);
  }
}
