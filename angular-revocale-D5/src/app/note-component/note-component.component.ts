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
import { isUndefined } from 'util';
import { NotaResponse } from './notaResponse.model';
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
  selectedTipo: string = '';
  selectedPenalita: string = '';
  sharedProfData: SharedProfDataService;
  @Output() votoOK: EventEmitter<Object>;
  formNota: FormGroup;
  selectedClass: Corrispondenza;
  observableChangeSelectedClass: Observable<Corrispondenza>;
  visuaForm: boolean;
  selectedStudente: Studente = null;
  formBuilder: FormBuilder;
  obsInserNota: Observable<Object>;
  noteStudente: Nota[];
  noteClasse: Nota[];
  constructor(fb: FormBuilder, private http: HttpClient, sharedProfData: SharedProfDataService) {
    this.httpClient = http;
    this.sharedProfData = sharedProfData;
    this.formBuilder = fb;
  }

  ngOnInit(): void {
    this.profData = this.sharedProfData.profData;
    this.observableChangeSelectedClass = this.sharedProfData.getObservable();
    this.onClassChange(this.sharedProfData.selectedClass);
    this.observableChangeSelectedClass.subscribe(selectedClass => this.onClassChange(selectedClass));
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

  onSubmitNota(): void {
    let notaOgg: Nota = new Nota();
    notaOgg.Tipologia = this.formNota.controls['tipologia'].value;
    notaOgg.TipoPenalita = this.formNota.controls['tipoPenalita'].value;
    notaOgg.DataNota = this.formNota.controls['dataNota'].value;
    notaOgg.Testo = this.formNota.controls['testo'].value;
    notaOgg.CFProfessore = this.profData.CFPersona;
    if (notaOgg.Tipologia == 0) {
      notaOgg.Destinatari = new Array<String>();
      for (let i = 0; i < this.formNota.controls['studentiDestinatari']['controls'].length; i++) {
        if (this.formNota.controls['studentiDestinatari']['controls'][i].value)
          notaOgg.Destinatari.push(this.studenti[i].Username);
      }
    }
    else {
      notaOgg.CodiceClasse = this.selectedClass.CodiceClasse;
    }
    if ((notaOgg.Tipologia == 0 && notaOgg.Destinatari.length > 0) || notaOgg.Tipologia == 1) {
      let httpHeaders: HttpHeaders = new HttpHeaders({ Authorization: String(this.profData.securedKey) });
      this.obsInserNota = this.httpClient.post(environment.node_server + '/api/note/inserisciNota', notaOgg, { headers: httpHeaders });
      this.obsInserNota.subscribe(
        (response) => {
          console.log(response);
          if (response['success'] == true) {
            this.buildForm();
            if (this.noteStudente) {
              if (notaOgg.Tipologia == 0)
                this.noteStudente.push(notaOgg);
              else
                this.noteClasse.push(notaOgg);
            }
          }
          else
            alert(response);
        });
    }
    else
      alert("Seleziona almeno uno studente");

  }

  getStudenti() {
    let httpHead = new HttpHeaders({ Authorization: String(this.profData.securedKey) });
    this.httpClient.get<Studente[]>(environment.node_server + `/api/prof/getStudentiByClasse?codiceClasse=${this.selectedClass.CodiceClasse}`, { headers: httpHead })
      .subscribe((response) => {
        //Cognome,Nome,Username
        this.studenti = response;
        for (let i = 0; i < this.studenti.length; i++)
          this.studenti[i]['selected'] = false;
        this.buildForm();
      })
  }

  buildForm() {
    let formArray = this.studenti.map((studente) => {
      return this.formBuilder.control(studente['selected']);
    });
    this.formNota = this.formBuilder.group(
      {
        'tipologia': [0, Validators.required],
        'testo': ['', Validators.required],
        'dataNota': ['', Validators.required],
        'tipoPenalita': [0, Validators.required],
        'studentiDestinatari': this.formBuilder.array(formArray)
      }
    )
  }

  getNoteStudente() {
    let httpHead = new HttpHeaders({ Authorization: String(this.profData.securedKey) });
    this.httpClient.get<NotaResponse>(environment.node_server + `/api/note/getNoteByStudente?usernameStudente=${this.selectedStudente.Username}`, { headers: httpHead })
      .subscribe((response) => {
        if (response.success) {
          this.noteStudente = response.recordset;
          for (let nota of this.noteStudente)
            nota.DataNota = nota.DataNota.substring(0, 10);
        }
      });
  }

  getNoteClasse() {
    let httpHead = new HttpHeaders({ Authorization: String(this.profData.securedKey) });
    this.httpClient.get<NotaResponse>(environment.node_server + `/api/note/getNoteByClasse?codiceClasse=${this.selectedClass.CodiceClasse}`, { headers: httpHead })
      .subscribe((response) => {
        if (response.success) {
          this.noteClasse = response.recordset;
          for (let nota of this.noteClasse)
            nota.DataNota = nota.DataNota.substring(0, 10);

        }
      });
  }

  onClassChange(selectedClass: Corrispondenza) {
    this.selectedClass = selectedClass;
    this.studenti = null;
    this.formNota = null;
    this.noteStudente = null;
    this.getStudenti();
    this.getNoteClasse();
  }

  onStudentSelection(selectedStudent: Studente) {
    this.selectedStudente = selectedStudent;
    this.visuaForm = (selectedStudent != null);
    this.noteStudente = Array<Nota>();
    if (this.visuaForm)
      this.getNoteStudente();
    else
      this.noteStudente = null;
  }



}


