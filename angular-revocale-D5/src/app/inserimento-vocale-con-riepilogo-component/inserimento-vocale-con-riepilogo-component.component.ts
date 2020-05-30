import { Component, OnInit } from '@angular/core';
import * as RecordRTC from 'recordrtc';
import { DomSanitizer } from '@angular/platform-browser';
import { OnDestroy } from '@angular/core';
import { AudioRecordingService } from './audio-recording.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Voti } from '../voti.model';

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
  findKeywordsIndexes(transcriptionArray : Array<String>, keywords : Array<String>) : Array<Object>
  {
    let indexes = new Array<Object>();
    for(let i = 0; i < keywords.length; i++)
    {
      let foundIndex = transcriptionArray.indexOf(keywords[i]);
      console.log(foundIndex, keywords[i]);
      if(foundIndex != -1)
      {
        let corr = {"keyword" : keywords[i], "index" : foundIndex};
        indexes.push(corr);
      }
    }
    return indexes;
  }
  readVoto(transcription : string)
  {
    let keywordsVoto = ["voto", "studente", "descrizione", "data", "peso", "valore"];
    let transcriptionArray = transcription.split(" ");
    console.log(transcriptionArray);
    let corrispondenze = this.findKeywordsIndexes(transcriptionArray, keywordsVoto);
    console.log(corrispondenze);
    let voto, studente = "", descrizione = "", data, peso, valore;
    let votoOgg = new Voti();
    let corrispondenzaVoto = corrispondenze.find((corrispondenza) =>
    {
      return corrispondenza["keyword"] == "voto";
    });

    if(corrispondenzaVoto == null)
    {
      alert("Voto non trovato nel comando vocale");
      return;
    }else
      voto =  0 + Number(transcriptionArray[corrispondenzaVoto['index'] + 1]);

    if(String(voto) == "NaN")
    {
      alert("Il voto non è un numero");
      return;
    }
    votoOgg.Voto = voto;
    let corrispondenzaStudente = corrispondenze.find((corrispondenza) =>
    {
      return corrispondenza["keyword"] == "studente";
    });

    let corrispondenzaDescrizione = corrispondenze.find((corrispondenza) =>
    {
      return corrispondenza["keyword"] == "descrizione";
    });
    console.log(corrispondenzaStudente);
    console.log(corrispondenzaDescrizione);

    if(corrispondenzaStudente == null || corrispondenzaDescrizione == null)
    {
      alert("Dati mancanti");
      return;
    }
    else
    {
      for(let i = (corrispondenzaStudente['index'] + 1); i < corrispondenzaDescrizione['index']; i++)
        studente += transcriptionArray[i] + " ";

      studente = studente.trim();
    }

    let nextCorrispondenza = corrispondenze[3];
    if(nextCorrispondenza == undefined)
    {
      descrizione = transcriptionArray.slice(corrispondenzaDescrizione['index'] + 1).toString().replace(/,/g, " ").replace("\"", " ");
    }
    else
    {
      for(let i = corrispondenzaDescrizione['index'] + 1; i < nextCorrispondenza['index']; i++)
        descrizione += transcriptionArray[i] + " ";

      descrizione = descrizione.trim();
    }
    votoOgg.Descrizione = descrizione;
    let corrispondenzaData = corrispondenze.find((corrispondenza) =>
    {
      return corrispondenza["keyword"] == "data";
    });

    if(corrispondenzaData != null)
    {
      let mesianno =  ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
      let giorno = Number(transcriptionArray[corrispondenzaData['index'] + 1]);
      let mese = mesianno.indexOf(transcriptionArray[corrispondenzaData['index'] + 2]);
      let anno = Number(transcriptionArray[corrispondenzaData['index'] + 3]);
      console.log(giorno, mese, anno)
      data = new Date(anno, mese, giorno);
    }
    else
    {
      data = new Date();
    }
    votoOgg.DataVoto = data;
    console.log(votoOgg, studente);
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
    transcription = String(transcription.replace(/\n/g, " ").replace(/\"/g, " ")).trim();
    console.log(typeof transcription);
    transcription = transcription.toLowerCase();
    this.lasttranscription = transcription;

    //Inserimento vocale voto: Inserisci voto <1 => 10> a studente <Nome Cognome Studente> Descrizione <Descrizione> [Data <Giorno - Mese - Anno> Peso <0 - 100> {Con Valore | Senza Valore | Recupero}]
    if(!transcription.includes("Inserisci voto"))
      this.readVoto(transcription);
    else if(!transcription.includes("Inserisci nota"))
      this.readNota(transcription);
    else if(!transcription.includes("Inserisci assenza"))
      this.readAssenza(transcription);
  }
}
