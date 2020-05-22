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
  selectedTipo: string = '';
  selectedPenalita: string = '';
  sharedProfData: SharedProfDataService;
  @Output() votoOK: EventEmitter<Object>;
  formNota: FormGroup;
  selectedClass: Corrispondenza;
  observableChangeSelectedClass: Observable<Corrispondenza>;
  visuaForm: boolean;
  selectedStudente: Studente;
  formBuilder: FormBuilder;
  obsInserNota: Observable<Object>;
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
    console.log('Descrizione: ', this.formNota.controls['tipologia'].value);
    console.log("Tipo: " + this.formNota.controls['tipoPenalita'].value);
    console.log("Penalità: ", this.formNota.controls['dataNota'].value);
    console.log("Data: ", this.formNota.controls['testo'].value);

    notaOgg.Tipologia = this.formNota.controls['tipologia'].value;
    notaOgg.TipoPenalità = this.formNota.controls['tipoPenalita'].value;
    notaOgg.DataNota = this.formNota.controls['dataNota'].value;
    notaOgg.Testo = this.formNota.controls['testo'].value;
    notaOgg.CFProfessore = this.profData.CFPersona;
    if(notaOgg.Tipologia == 0)
    {
      notaOgg.Destinatari = new Array<String>();
      for(let i = 0; i < this.formNota.controls['destintatari']['controls']; i++)
      {
        if(this.formNota.controls['destintatari']['controls'][i].selected)
          notaOgg.Destinatari.push(this.studenti[i].Username);
      }
    }
    else
    {
      notaOgg.CodiceClasse = this.selectedClass.CodiceClasse;
    }
    //this.obsInserNota =
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
    console.log(this.formNota);
  }

  getNote() {

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
    this.getNote();

  }



}


