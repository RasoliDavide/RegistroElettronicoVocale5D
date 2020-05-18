import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Classe } from '../classe.model';
import { ProfData } from '../prof.model';
import { SharedProfDataService } from '../shared-prof-data.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Studente } from '../studente.model';
import { Voti } from '../voti.model';
import { environment } from 'src/environments/environment';
import { Corrispondenza } from '../corrispondenze.model';
import { Nota } from "../nota.model";
@Component({
  selector: 'app-note-component',
  templateUrl: './note-component.component.html',
  styleUrls: ['./note-component.component.css']
})
export class NoteComponentComponent implements OnInit {
  notaDiClasse: boolean = true;
  studenti: Studente[];
  httpClient: HttpClient;
  tipoSelect: boolean;
  penalitaSelect: boolean;
  @Input() profData: ProfData;
  //@Input() studente: Studente;
  selectedTipo: string = '';
  selectedPenalita: string = '';
  //arrayPeso: number[] = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  sharedProfData: SharedProfDataService;
  @Output() votoOK: EventEmitter<Object>;
  formNota: FormGroup;
  selectedClass: Corrispondenza;
  observableChangeSelectedClass : Observable<Corrispondenza>;
  visuaForm: boolean;
  selectedStudente: Studente;
  constructor(fb: FormBuilder, private http: HttpClient, sharedProfData: SharedProfDataService) {
    this.httpClient = http;
    this.sharedProfData = sharedProfData;
    this.formNota = fb.group(
      {
        'tipoNota' : ['0', Validators.required],
        'descrizione': ['', Validators.required],
        'data':['',Validators.required],
        'tipoPenalita':['0', Validators.required]

      }
    )
  }

  ngOnInit(): void {
    this.profData = this.sharedProfData.profData;
    this.observableChangeSelectedClass = this.sharedProfData.getObservable();
    this.onClassChange(this.sharedProfData.selectedClass);
    this.observableChangeSelectedClass.subscribe(selectedClass => this.onClassChange(selectedClass));
    this.getStudenti();
  }
  selectChangeHandler(event: any) {
    this.selectedTipo = event.target.value;
    this.selectedPenalita = event.target.value;
  }
  toggleEditable(event) {
    if (event.target.checked) {
      this.tipoSelect = true;
      this.penalitaSelect = true;
    } else {
      this.tipoSelect = false;
      this.penalitaSelect = false;
    }
  }
  onSubmitNota(value: string): void {
    let notaOgg: Nota = new Nota();
    console.log('Descrizione: ', this.formNota.controls['descrizione'].value);
    console.log("Tipo: " + this.formNota.controls['tipoNota'].value);
    console.log("Penalità: ", this.formNota.controls['tipoPenalita'].value);
    console.log("Data: ", this.formNota.controls['data'].value);

    notaOgg.Tipologia =  this.formNota.controls['tipoNota'].value;
    notaOgg.TipoPenalità = this.formNota.controls['tipoPenalita'].value;
    notaOgg.Data = this.formNota.controls['data'].value;
    notaOgg.Testo = this.formNota.controls['descrizione'].value;

    this.formNota.reset();

   /* if (notaOgg.Tipologia == 0) {
      notaOgg.Testo = this.formNota.controls['descrizione'].value;
      console.log("Tipo: " + notaOgg.Tipologia);
      console.log("Penalità: ", notaOgg.TipoPenalità);



    } else {
      if (notaOgg.Tipologia == 1) {

        notaOgg.Testo = this.formNota.controls['descrizione'].value;
        console.log("Tipo: " + notaOgg.Tipologia);
        console.log('Penalità: ', notaOgg.TipoPenalità);



      }
      else {

        notaOgg.Testo = this.formNota.controls['descrizione'].value;
        console.log("Tipo: " + notaOgg.Tipologia);
        console.log('Penalità: ', notaOgg.TipoPenalità);

      }

      v.Data = this.formAssenza.controls['data'].value;
      v.Ora = this.formAssenza.controls['orario'].value;
      v.Concorre =this.concorreSelect;
      //a.CFStudente
      //a.CFProfessore

        }
      }*/
  }
  getStudenti() {
    let httpHead = new HttpHeaders({ Authorization: String(this.profData.securedKey) });
    this.httpClient.get<Studente[]>(environment.node_server + `/api/prof/getStudentiByClasse?codiceClasse=${this.selectedClass.CodiceClasse}`, { headers: httpHead })
      .subscribe((response) => {
        //Cognome,Nome,Username
        this.studenti = response;
        console.log(this.studenti);

      })
  }
  getNote(){

  }
  onClassChange(selectedClass: Corrispondenza) {
    console.log(selectedClass);
    this.selectedClass = selectedClass;
    this.studenti = null;
    this.getStudenti();
  }

  onStudentSelection(selectedStudent: Studente) {
    this.selectedStudente = selectedStudent;
    this.visuaForm = (typeof (this.selectedStudente) == 'object');
    if (this.visuaForm)
      this.getNote();

  }



}


