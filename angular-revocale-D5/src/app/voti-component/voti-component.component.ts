import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Classi } from '../classi.model';
import { ProfData } from '../prof.model';
import { SharedProfDataService } from '../shared-prof-data.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Studente } from '../studente.model';
import { Voti } from '../voti.model';
import { environment } from 'src/environments/environment';
import { Corrispondenza } from '../corrispondenze.model';
import { Injectable } from '@angular/core';
import * as RecordRTC from 'recordrtc';
import { AudioRecordingService } from './audio-recording.service';
import { DomSanitizer } from '@angular/platform-browser';
@Component({
  selector: 'app-voti-component',
  templateUrl: './voti-component.component.html',
  styleUrls: ['./voti-component.component.css']
})
@Injectable()
export class VotiComponentComponent implements OnInit, OnDestroy {
  isRecording = false;
  recordedTime;
  blobUrl;



  studenti: Studente[];
  httpClient: HttpClient;
  concorreSelect: boolean;
  pesoSelect: boolean;
  @Input() profData: ProfData;
  //@Input() studente: Studente;
  selectedVoto: string = '';
  selectedPeso: string = '';
  arrayPeso: number[] = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  sharedProfData: SharedProfDataService;
  @Output() votoOK: EventEmitter<Object>;
  formVoto: FormGroup;
  selectedClass: Corrispondenza;
  /*private stream;
  private recorder;
  private interval;
  private startTime;
  private _recorded = new Subject<any>();
  private _recordingTime = new Subject<string>();
  private _recordingFailed = new Subject<string>();*/
  constructor(fb: FormBuilder, private http: HttpClient, sharedProfData: SharedProfDataService, private audioRecordingService: AudioRecordingService, private sanitizer: DomSanitizer) {
    this.httpClient = http;
    this.sharedProfData = sharedProfData;
    this.formVoto = fb.group(
      {
        'voto': ['', Validators.required],
        'descrizione': ['', Validators.required],
        'data': ['', Validators.required],

      }
    )
    this.audioRecordingService.recordingFailed().subscribe(() => {
      this.isRecording = false;
    });

    this.audioRecordingService.getRecordedTime().subscribe((time) => {
      this.recordedTime = time;
    });

    this.audioRecordingService.getRecordedBlob().subscribe((data) => {
      this.blobUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(data.blob));
    });
  }

  startRecording() {
    if (!this.isRecording) {
      this.isRecording = true;
      this.audioRecordingService.startRecording();
    }
  }

  abortRecording() {
    if (this.isRecording) {
      this.isRecording = false;
      this.audioRecordingService.abortRecording();
    }
  }

  stopRecording() {
    if (this.isRecording) {
      this.audioRecordingService.stopRecording();
      this.isRecording = false;
    }
  }

  clearRecordedData() {
    this.blobUrl = null;
  }

  ngOnDestroy(): void {
    this.abortRecording();
  }



  ngOnInit(): void {
    this.profData = this.sharedProfData.profData;
  }
  selectChangeHandler(event: any) {
    this.selectedVoto = event.target.value;
    this.selectedPeso = event.target.value;
  }
  toggleEditable(event) {
    if (event.target.checked) {
      this.concorreSelect = true;
      this.pesoSelect = true;
    } else {
      this.concorreSelect = false;
      this.pesoSelect = false;
    }
  }
  onSubmitVoto(value: string): void {
    let v: Voti = new Voti();
    console.log('Voto: ', this.formVoto.controls['voto'].value);
    console.log('Descrizione: ', this.formVoto.controls['descrizione'].value);
    console.log('Data: ', this.formVoto.controls['data'].value);
    v.tipo = this.selectedVoto;
    v.peso = parseInt(this.selectedPeso);

    if (v.tipo == "0") {
      for (let i = 0; i < this.arrayPeso.length; i++) {
        if (v.peso == this.arrayPeso[i]) {
          v.voto = this.formVoto.controls['voto'].value;
          v.descrizione = this.formVoto.controls['descrizione'].value;
          v.tipo = "0";
          v.peso = this.arrayPeso[i];
          v.data = this.formVoto.controls['data'].value;
          console.log("Peso: " + v.peso);
          console.log('Tipo: ', v.tipo);


        }
      }



      /*v.Data = this.formVoto.controls['data'].value;
      v.Ora = null;
      v.Concorre =this.concorreSelect;*/
      //a.CFStudente
      //a.CFProfessore
    } else {
      if (v.tipo == "1") {
        for (let i = 0; i < this.arrayPeso.length; i++) {
          if (v.peso == this.arrayPeso[i]) {
            v.voto = this.formVoto.controls['voto'].value;
            v.descrizione = this.formVoto.controls['descrizione'].value;
            v.tipo = "1";
            v.peso = this.arrayPeso[i];
            v.data = this.formVoto.controls['data'].value;
            console.log("Peso: " + v.peso);
            console.log('Tipo: ', v.tipo);

          }
        }
      }
      else {
        for (let i = 0; i < this.arrayPeso.length; i++) {
          if (v.peso == this.arrayPeso[i]) {
            v.voto = this.formVoto.controls['voto'].value;
            v.descrizione = this.formVoto.controls['descrizione'].value;
            v.tipo = "0";
            v.peso = this.arrayPeso[i];
            v.data = this.formVoto.controls['data'].value;
            console.log("Peso: " + v.peso);
            console.log('Tipo: ', v.tipo);

          }
        }
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
