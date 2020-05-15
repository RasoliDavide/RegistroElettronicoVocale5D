import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Classi } from '../classi.model';
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
  constructor(fb: FormBuilder, private http: HttpClient, sharedProfData: SharedProfDataService) {
    this.httpClient = http;
    this.sharedProfData = sharedProfData;
    this.formNota = fb.group(
      {

        'descrizione': ['', Validators.required],
        //'data':['',Validators.required],

      }
    )
  }

  ngOnInit(): void {
    this.profData = this.sharedProfData.profData;
    console.log('Data: ', this.formNota.controls['data'].value);
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
    let n: Nota = new Nota();
    console.log('Descrizione: ', this.formNota.controls['descrizione'].value);
    console.log('Data: ', this.formNota.controls['data'].value);
    n.Tipologia = parseInt(this.selectedTipo);
    n.TipoPenalità = parseInt(this.selectedPenalita);

    if (n.Tipologia == 0) {
      n.Testo = this.formNota.controls['descrizione'].value;
      console.log("Tipo: " + n.Tipologia);
      console.log('Penalità: ', n.TipoPenalità);



    } else {
      if (n.Tipologia == 1) {

        n.Testo = this.formNota.controls['descrizione'].value;
        console.log("Tipo: " + n.Tipologia);
        console.log('Penalità: ', n.TipoPenalità);



      }
      else {

        n.Testo = this.formNota.controls['descrizione'].value;
        console.log("Tipo: " + n.Tipologia);
        console.log('Penalità: ', n.TipoPenalità);

      }

      /*v.Data = this.formAssenza.controls['data'].value;
      v.Ora = this.formAssenza.controls['orario'].value;
      v.Concorre =this.concorreSelect;*/
      //a.CFStudente
      //a.CFProfessore*/
    }
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
  onClassChange(selectedClass: Corrispondenza) {
    console.log(selectedClass);
    this.selectedClass = selectedClass;
  }



}
