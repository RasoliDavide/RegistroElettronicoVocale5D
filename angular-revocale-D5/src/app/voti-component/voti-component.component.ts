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
  formBuilder: FormBuilder;


  constructor(fb: FormBuilder, private http: HttpClient, sharedProfData: SharedProfDataService, private domSanitizer: DomSanitizer /*private audioRecordingService: AudioRecordingService, private sanitizer: DomSanitizer*/) {
    this.httpClient = http;
    this.sharedProfData = sharedProfData;
    this.formBuilder = fb;
    this.buildForm();
  }

  buildForm() {
    this.formVoto = this.formBuilder.group(
      {
        'peso': [100, Validators.required],
        'tipologia': [1, Validators.required],
        'descrizione': ['', Validators.required],
        'voto': ['', Validators.required],
        'dataVoto': ['', Validators.required],
      })


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
  onSubmitVoto(value: string): void {
    let v: Voti = new Voti();
    v.Peso = parseInt(this.selectedPeso);
    v.Voto = this.formVoto.controls['voto'].value;
    v.Descrizione = this.formVoto.controls['descrizione'].value;
    v.Peso = this.formVoto.controls['peso'].value;
    v.Tipologia = this.formVoto.controls['tipologia'].value;
    v.DataVoto = this.formVoto.controls['dataVoto'].value;
    v.UsernameStudente = this.selectedStudente.Username;
    v.CFProfessore = this.profData.CFPersona;
    v.CodiceMateria = this.selectedClass.CodiceMateria;


    let httpHeaders = new HttpHeaders({"Authorization": String(this.profData.securedKey)})
    this.observVoto = this.http.post(environment.node_server + '/api/voti/inserisciVoto', v, { headers: httpHeaders });
    this.observVoto.subscribe(
      (response) => {
        if (response['success'])
        {
          this.voti.push(v);
          this.buildForm();
        }
      }
    )

  }


  getStudenti() {
    let httpHead = new HttpHeaders({ Authorization: String(this.profData.securedKey) });
    this.httpClient.get<Studente[]>(environment.node_server + `/api/prof/getStudentiByClasse?codiceClasse=${this.selectedClass.CodiceClasse}`, { headers: httpHead })
      .subscribe((response) => {
        this.studenti = response;
      })
  }
  onClassChange(selectedClass: Corrispondenza) {
    this.selectedClass = selectedClass;
    this.studenti = null;
    this.selectedStudente = null;
    this.visuaForm = false;
    this.voti = null;
    this.buildForm();
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
    console.log(selectedStudent)
    this.visuaForm = (this.selectedStudente != null);
    this.buildForm();
    if (this.visuaForm)
      this.getVoti();

  }




}
