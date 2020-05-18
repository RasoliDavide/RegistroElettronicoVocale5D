import { Component, OnInit, Input, Output, EventEmitter, /*OnDestroy*/ } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Classe } from '../classe.model';
import { ProfData } from '../prof.model';
import { SharedProfDataService } from '../shared-prof-data.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Studente } from '../studente.model';
import { Voti } from '../voti.model';
import { environment } from 'src/environments/environment';
import { Corrispondenza } from '../corrispondenze.model';
import { Injectable } from '@angular/core';

//import { AudioRecordingService } from './audio-recording.service';


import * as RecordRTC from 'recordrtc';
import { DomSanitizer } from '@angular/platform-browser';



@Component({
  selector: 'app-voti-component',
  templateUrl: './voti-component.component.html',
  styleUrls: ['./voti-component.component.css']
})
//@Injectable()

export class VotiComponentComponent implements OnInit {

  private record;
  //Will use this flag for detect recording
  recording = false;
  //Url of Blob
  url: string;
  private error;
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
  observVoto: Observable<Object>;
  selectedStudente: Studente;
  visuaForm: boolean;
  voti: Voti[];
  observableChangeSelectedClass: Observable<Corrispondenza>;
  /*private stream;
  private recorder;
  private interval;
  private startTime;
  private _recorded = new Subject<any>();
  private _recordingTime = new Subject<string>();
  private _recordingFailed = new Subject<string>();*/

  constructor(fb: FormBuilder, private http: HttpClient, sharedProfData: SharedProfDataService, private domSanitizer: DomSanitizer /*private audioRecordingService: AudioRecordingService, private sanitizer: DomSanitizer*/) {
    this.httpClient = http;
    this.sharedProfData = sharedProfData;
    this.formVoto = fb.group(
      {
        'peso': [100, Validators.required],
        'tipologia': [1, Validators.required],
        'descrizione': ['', Validators.required],
        'voto': ['', Validators.required],
        'data': ['', Validators.required],
      }
    )

    /*this.audioRecordingService.recordingFailed().subscribe(() => {
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
  }*/

  }
  sanitize(url: string) {
    return this.domSanitizer.bypassSecurityTrustUrl(url);
  }
  initiateRecording() {

    this.recording = true;
    let mediaConstraints = {
      video: false,
      audio: true
    };
    navigator.mediaDevices
      .getUserMedia(mediaConstraints)
      .then(this.successCallback.bind(this), this.errorCallback.bind(this));
  }
  /**
   * Will be called automatically.
   */
  successCallback(stream) {
    var options = {
      mimeType: "audio/wav",
      numberOfAudioChannels: 1
    };
    //Start Actuall Recording
    var StereoAudioRecorder = RecordRTC.StereoAudioRecorder;
    this.record = new StereoAudioRecorder(stream, options);
    this.record.record();
  }
  /**
   * Stop recording.
   */
  stopRecording() {
    this.recording = false;
    this.record.stop(this.processRecording.bind(this));
  }
  /**
   * processRecording Do what ever you want with blob
   * @param  {any} blob Blog
   */
  processRecording(blob) {
    this.url = URL.createObjectURL(blob);
    console.log(this.url);
  }
  /**
   * Process Error.
   */
  errorCallback(error) {
    this.error = 'Can not play audio in your browser';
  }





  ngOnInit(): void {
    this.profData = this.sharedProfData.profData;
    this.observableChangeSelectedClass = this.sharedProfData.getObservable();
    this.onClassChange(this.sharedProfData.selectedClass);
    this.observableChangeSelectedClass.subscribe(selectedClass => this.onClassChange(selectedClass));
    this.getStudenti();


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
    v.Peso = parseInt(this.selectedPeso);
    v.Voto = this.formVoto.controls['voto'].value;
    v.Descrizione = this.formVoto.controls['descrizione'].value;
    v.Peso = this.formVoto.controls['peso'].value;
    v.Tipologia = this.formVoto.controls['tipologia'].value;
    v.DataVoto = this.formVoto.controls['data'].value;
    v.UsernameStudente = this.selectedStudente.Username;
    v.CFProfessore = this.profData.CFPersona;
    v.CodiceMateria = this.selectedClass.CodiceMateria;
    console.log("Peso: " + v.Peso);
    console.log('Tipo: ', v.Tipologia);


    let httpHeaders = new HttpHeaders({ "Authorization": String(this.profData.securedKey) })
    this.observVoto = this.http.post(environment.node_server + '/api/voti/inserisciVoto', v, { headers: httpHeaders });
    this.observVoto.subscribe(
      (data) => {
        console.log(data);
        if(data = true){
          this.voti.push(v);
        }
      }
    )
    this.formVoto.reset();


    /*v.Data = this.formAssenza.controls['data'].value;
    v.Ora = this.formAssenza.controls['orario'].value;
    v.Concorre =this.concorreSelect;*/
    //a.CFStudente
    //a.CFProfessore*/

  }


  getStudenti() {
    let httpHead = new HttpHeaders({ Authorization: String(this.profData.securedKey) });
    this.httpClient.get<Studente[]>(environment.node_server + `/api/prof/getStudentiByClasse?codiceClasse=${this.selectedClass.CodiceClasse}`, { headers: httpHead })
      .subscribe((response) => {
        this.studenti = response;
        console.log(this.studenti);
      })
  }
  onClassChange(selectedClass: Corrispondenza) {
    console.log(selectedClass);
    this.selectedClass = selectedClass;
    this.studenti = null;
    this.getStudenti();
  }
  getVoti() {
    let httpHead = new HttpHeaders({ Authorization: String(this.profData.securedKey) });
    this.httpClient.get<Voti[]>(environment.node_server + `/api/voti/getVotiByStudente?UsernameStudente=${this.selectedStudente.Username}`, { headers: httpHead })
      .subscribe((response) => {
        this.voti = response;
        for (let voto of this.voti) {
          voto.DataVoto = voto.DataVoto.substring(0, 10);
          switch (voto.Tipologia) {
            case ('0'):
              voto.Tipologia = 'Valore';
              this.concorreSelect = true;
              break;
            case ('1'):
              voto.Tipologia = 'Senza Valore';
              this.concorreSelect = false;
              break;
            case ('2'):
              voto.Tipologia = 'Recupero';
              this.concorreSelect = false;
              break;
          }
        }
      })
  }
  onStudentSelection(selectedStudent: Studente) {
    this.selectedStudente = selectedStudent;
    this.visuaForm = (typeof (this.selectedStudente) == 'object');
    if (this.visuaForm)
      this.getVoti();

  }




}
