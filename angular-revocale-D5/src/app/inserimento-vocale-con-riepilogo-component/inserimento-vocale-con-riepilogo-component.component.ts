import { Component, OnInit } from '@angular/core';
import * as RecordRTC from 'recordrtc';
import { DomSanitizer } from '@angular/platform-browser';
import { OnDestroy } from '@angular/core';
import { AudioRecordingService } from './audio-recording.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-inserimento-vocale-con-riepilogo-component',
  templateUrl: './inserimento-vocale-con-riepilogo-component.component.html',
  styleUrls: ['./inserimento-vocale-con-riepilogo-component.component.css']
})
@Injectable()
export class InserimentoVocaleConRiepilogoComponentComponent implements OnInit, OnDestroy {
  isRecording = false;
  recordedTime;
  blobUrl;
  transcriptionObs : Observable<String>;
  lasttranscription:String;
  constructor(private audioRecordingService: AudioRecordingService, private sanitizer: DomSanitizer) {

    this.audioRecordingService.recordingFailed().subscribe(() => {
      this.isRecording = false;
    });

    this.audioRecordingService.getRecordedTime().subscribe((time) => {
      this.recordedTime = time;
    });

    this.audioRecordingService.getRecordedBlob().subscribe((data) => {
      this.blobUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(data.blob));
    });
    this.transcriptionObs = audioRecordingService.getTranscriptionObservable();
    this.transcriptionObs.subscribe(this.receiveTranscription);
  }

  ngOnInit() {

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
  findKeywordsIndexes(transcriptionArray : Array<String>, keywords : Array<String>) : Array<number>
  {
    let indexes = new Array<number>();
    for(let i = 0; i < keywords.length; i++)
    {
      let foundIndex = transcriptionArray.indexOf(keywords[i]);
      indexes.push(foundIndex);
    }
    return indexes;
  }
  readVoto(transcription : string)
  {
    let keywordsVoto = ["Voto", "Studente", "Descrizione", "Data", "Peso"];
    let transcriptionArray = transcription.split(" ");

    let indexVoto = transcriptionArray.indexOf('voto');
    let indexStudente = transcriptionArray.indexOf('studente');
    let indexDescrizione = transcriptionArray.indexOf('descrizione');

    let voto = transcriptionArray[indexVoto + 1];
    let studente = transcriptionArray[indexStudente + 1] + " " + transcriptionArray[indexStudente + 2];
    let descrizione = transcriptionArray.slice(indexDescrizione + 1);
    console.log("Voto: " + voto, indexVoto);
    console.log("Studente: " + studente, indexStudente);
    console.log("Descrizione: " + descrizione.toString().replace(",", " "), indexDescrizione);
  }
  readNota(transcription : string)
  {

    let transcriptionArray = transcription.split(" ");
    let indexTipologia = transcriptionArray.indexOf('tipologia');
    let indexStudente = transcriptionArray.indexOf('studente');
    let indexDescrizione = transcriptionArray.indexOf('descrizione');
    let indexPenalita = transcriptionArray.indexOf('penalità');

    let tipologia = transcriptionArray[indexTipologia + 1];
    let studente = transcriptionArray[indexStudente + 1] + " " + transcriptionArray[indexStudente + 2];
    let descrizione = transcriptionArray.slice(indexDescrizione + 1);
    let penalita = transcriptionArray.slice(indexPenalita + 1);
    console.log("Tipologia: " + tipologia, indexTipologia);
    console.log("Studente: " + studente, indexStudente);
    console.log("Descrizione: " + descrizione, indexDescrizione);
    console.log("Penalità: " + penalita, indexPenalita);
  }
  readAssenza(transcription : string)
  {
    let transcriptionArray = transcription.split(" ");
    let indexTipologiaA = transcriptionArray.indexOf('assenza');
    let indexStudente = transcriptionArray.indexOf('studente');
    let indexData = transcriptionArray.indexOf('data');
	  let indexOrario = transcriptionArray.indexOf('orario');
	  let indexConcorre = transcriptionArray.indexOf('concorre al calcolo');
    let tipologiaA = transcriptionArray[indexTipologiaA + 1];
    let studente = transcriptionArray[indexStudente + 1] + " " + transcriptionArray[indexStudente + 2];
    let data = transcriptionArray.slice(indexData + 1);
	  let orario = transcriptionArray[indexOrario + 1];
	  let concorre = transcriptionArray[indexConcorre + 1];

    console.log("Tipologia: " + tipologiaA, indexTipologiaA);
    console.log("Studente: " + studente, indexStudente);
    console.log("Data: " + data, indexData);
    console.log("Orario: " + orario, indexOrario);
	  console.log("Concorre al calcolo: " + concorre, indexConcorre);
  }
  receiveTranscription = (transcription : string) =>
  {
    transcription = String(transcription.replace("\n", " ")).trim();
    console.log("Received transcription: " + transcription);
    console.log(typeof transcription);
    this.lasttranscription = transcription;
    transcription = transcription.toLowerCase();
    //Inserimento vocale voto: Inserisci voto <1 => 10> a studente <Nome Cognome Studente> Descrizione <Descrizione> [Data <Giorno - Mese - Anno> Peso <0 - 100> {Con Valore | Senza Valore | Recupero}]
    console.log(transcription, typeof transcription);
    if(!transcription.includes("Inserisci voto"))
      this.readVoto(transcription);
    if(!transcription.includes("Inserisci nota"))
      this.readNota(transcription);
    if(!transcription.includes("Inserisci assenza"))
      this.readVoto(transcription);
  }


}
