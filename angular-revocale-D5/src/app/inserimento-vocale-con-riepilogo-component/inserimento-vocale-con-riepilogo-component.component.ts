import { Component, OnInit } from '@angular/core';
import * as RecordRTC from 'recordrtc';
import { DomSanitizer } from '@angular/platform-browser';
import { OnDestroy } from '@angular/core';
import { AudioRecordingService } from './audio-recording.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Voti } from '../voti.model';
import { Nota } from "../nota.model";
import { isNumber } from 'util';
import { Assenza } from '../assenza.model';
import { Comunicazione } from '../comunicazione.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Firma } from '../firma.model';
import { SharedProfDataService } from '../shared-prof-data.service';

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
  transcriptionObs: Observable<String>;
  lasttranscription: String;
  istrVedi=false;
  httpClient : HttpClient;
  sharedProfData : SharedProfDataService;
  constructor(private audioRecordingService: AudioRecordingService, private sanitizer: DomSanitizer, http : HttpClient, sharedProfData : SharedProfDataService) {

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
    this.httpClient = http;
    this.sharedProfData = sharedProfData;
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
  findKeywordsIndexes(transcriptionArray: Array<String>, keywords: Array<String>): Array<Object> {
    let indexes = new Array<Object>();
    for (let i = 0; i < keywords.length; i++) {
      let foundIndex = transcriptionArray.indexOf(keywords[i]);
      console.log(foundIndex, keywords[i]);
      if (foundIndex != -1) {
        let corr = { "keyword": keywords[i], "index": foundIndex };
        indexes.push(corr);
      }
    }
    return indexes;
  }
  isNumber(s: string | String): boolean {
    let n = Number(s);
    return (String(n) != "NaN")
  }
  toNumber(s: string | String): number {
    let n = Number(s);
    if (String(n) != "NaN")
      return n;
    else
      return NaN;
  }
  async readVoto(transcription: string) {
    let keywordsVoto = ["voto", "studente", "descrizione", "data", "peso", "valore"];
    let transcriptionArray = transcription.split(" ");
    for(let i = 0; i < transcriptionArray.length; i++)
      transcriptionArray[i] = transcriptionArray[i].trim();
    console.log(transcriptionArray);
    let corrispondenze = this.findKeywordsIndexes(transcriptionArray, keywordsVoto);
    console.log(corrispondenze);
    let voto, studente = "", descrizione = "", data, peso, valore;
    let votoOgg = new Voti();
    let corrispondenzaVoto = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "voto";
    });
    if (corrispondenzaVoto == null) {
      alert("Voto non trovato nel comando vocale");
      return;
    } else {
      voto = transcriptionArray[corrispondenzaVoto['index'] + 1];
      if (this.isNumber(voto)) {
        if (voto <= 10 && voto >= 1)
          votoOgg.Voto = this.toNumber(voto);
        else {
          alert("Il voto non è nel range consentito (1 -> 10)");
          return;
        }
      }
      else {
        alert("Il voto non è un numero");
        return;
      }
    }

    let corrispondenzaStudente = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "studente";
    });

    let corrispondenzaDescrizione = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "descrizione";
    });

    if (corrispondenzaStudente != null && corrispondenzaDescrizione != null) {
      for (let i = (corrispondenzaStudente['index'] + 1); i < corrispondenzaDescrizione['index']; i++)
        studente += transcriptionArray[i] + " ";

      studente = studente.trim();
    }
    else {
      alert("Dati mancanti");
      return;
    }

    let nextCorrispondenza = corrispondenze[3];
    if (nextCorrispondenza == undefined)
      descrizione = transcriptionArray.slice(corrispondenzaDescrizione['index'] + 1).toString().replace(/,/g, " ").replace("\"", " ");
    else {
      for (let i = corrispondenzaDescrizione['index'] + 1; i < nextCorrispondenza['index']; i++)
        descrizione += transcriptionArray[i] + " ";

      descrizione = descrizione.trim();
    }

    if (descrizione.length > 0)
      votoOgg.Descrizione = descrizione;
    else {
      alert("La descrizione deve contenere almeno una parola");
      return;
    }

    let corrispondenzaData = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "data";
    });

    if (corrispondenzaData != null) {
      let mesianno = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
      let giorno = Number(transcriptionArray[corrispondenzaData['index'] + 1]);
      let mese = mesianno.indexOf(transcriptionArray[corrispondenzaData['index'] + 2]);
      let anno = Number(transcriptionArray[corrispondenzaData['index'] + 3]);
      data = new Date(anno, mese, giorno);
      if (this.isNumber(data.getDate()) && this.isNumber(data.getMonth()) && this.isNumber(data.getFullYear()))
        votoOgg.DataVoto = data;
      else {
        alert("Data non valida");
        return;
      }
    }
    else
      data = new Date();

    let corrispondenzaPeso = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "peso";
    });

    if (corrispondenzaPeso != null) {
      let peso = transcriptionArray[corrispondenzaPeso['index'] + 1];
      if (this.isNumber(peso))
      {
        votoOgg.Peso = this.toNumber(peso);
        if(votoOgg.Peso > 100 || votoOgg.Peso < 0)
        {
          alert("Il peso non è nel range consentito (0 -> 100)");
          return;
        }
      }
      else
      {
        alert("Il peso specificato non è un numero");
        return;
      }
    }
    else
      votoOgg.Peso = 100;

    let corrispondenzaValore = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "valore";
    });

    if (corrispondenzaValore != null) {
      switch (transcriptionArray[corrispondenzaValore['index'] + 1]) {
        case ('sì'):
          votoOgg.Tipologia = String(1);
          break;
        case ('no'):
          votoOgg.Tipologia = String(0);
          break;
        case ('recupero'):
          votoOgg.Tipologia = String(2);
          break;
        default:
          alert("Tipo di voto (valore) non rilevato nel comando vocale");
          return;
          break; //Tanto non serve
      }
    }
    else
    votoOgg.Tipologia = String(1);
    let obs : Observable<Object> = this.httpClient.get(environment.node_server + `/api/stt/getUsernameByStudente?Nome=${studente.split(" ")[0]}&Cognome=${studente.split(" ")[1]}`);
    let response = await this.synchronizedHTTPRequest(obs);
    if(!response['success'])
    {
      alert("Errore: " + JSON.stringify(response));
      return;
    }
    let username = response['recordset'][0]['Username'];
    if(!username)
    {
      alert("Username non trovato");
      return;
    }
    votoOgg.UsernameStudente = username;
    votoOgg.CodiceMateria = this.sharedProfData.selectedClass.CodiceMateria;
    votoOgg.CFProfessore = this.sharedProfData.profData.CFPersona;
    let httpHeaders = new HttpHeaders({"Authorization": String(this.sharedProfData.profData.securedKey)})
    let observVoto= this.httpClient.post(environment.node_server + '/api/voti/inserisciVoto', votoOgg, { headers: httpHeaders });
    observVoto.subscribe(
      (response) => {
        if (response['success'])
          alert("Voto aggiunto correttamente");
        else
          alert("Errore: " + JSON.stringify(response));
      }
    )
  }
  async synchronizedHTTPRequest(obs : Observable<Object>)
  {
    let httpResponse = new Promise<Object>(
    (resolve, reject) =>
    {
      obs.subscribe((response) =>
      {
        resolve(response);
      });
    });
    let httpResult = await httpResponse;
    return httpResult;
  }
  readNota(transcription: string) {
    let keywordsNota = ["tipologia", "studente", "descrizione", "penalità", "data"];
    let transcriptionArray = transcription.split(" ");
    console.log(transcriptionArray);
    let corrispondenze = this.findKeywordsIndexes(transcriptionArray, keywordsNota);
    console.log(corrispondenze);
    let tipologia, studente = "", descrizione = "", data, penalita;
    let notaOgg = new Nota();
    let corrispondenzaNota = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "tipologia";
    });

    if (corrispondenzaNota == null) {
      alert("Tipologia non trovato nel comando vocale");
      return;
    } else
      tipologia = transcriptionArray[corrispondenzaNota['index'] + 1];

    if (tipologia == null) {
      alert("Tipologia non corretta");
      return;
    }
    notaOgg.Tipologia = tipologia;
    let corrispondenzaStudente = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "studente";
    });

    let corrispondenzaDescrizione = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "descrizione";
    });

    if (corrispondenzaStudente == null || corrispondenzaDescrizione == null) {
      alert("Dati mancanti");
      return;
    }
    else {
      for (let i = (corrispondenzaStudente['index'] + 1); i < corrispondenzaDescrizione['index']; i++)
        studente += transcriptionArray[i] + " ";

      studente = studente.trim();
    }

    let nextCorrispondenza = corrispondenze[3];
    if (nextCorrispondenza == undefined) {
      descrizione = transcriptionArray.slice(corrispondenzaDescrizione['index'] + 1).toString().replace(/,/g, " ").replace("\"", " ");
    }
    else {
      for (let i = corrispondenzaDescrizione['index'] + 1; i < nextCorrispondenza['index']; i++)
        descrizione += transcriptionArray[i] + " ";

      descrizione = descrizione.trim();
    }
    notaOgg.Testo = descrizione;
    let corrispondenzaData = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "data";
    });

    if (corrispondenzaData != null) {
      let mesianno = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
      let giorno = Number(transcriptionArray[corrispondenzaData['index'] + 1]);
      let mese = mesianno.indexOf(transcriptionArray[corrispondenzaData['index'] + 2]);
      let anno = Number(transcriptionArray[corrispondenzaData['index'] + 3]);
      console.log(giorno, mese, anno)
      data = new Date(anno, mese, giorno);
    }
    else
      data = new Date();

    notaOgg.DataNota = data;
    let corrispondenzaPenalita = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "penalità";
    });
    if (corrispondenzaPenalita != null) {
      switch (transcriptionArray[corrispondenzaPenalita['index'] + 1]) {
        case ('sospensione'):
          notaOgg.TipoPenalita = Number(1);
          break;
        case ('nota'):
          notaOgg.TipoPenalita = Number(0);
          break;
        case ('espulsione'):
          notaOgg.TipoPenalita = Number(2);
          break;
      }
    }
    else
      notaOgg.TipoPenalita = Number(1);

    /*let transcriptionArray = transcription.split(" ");
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
    console.log("Penalità: " + penalita, indexPenalita);*/
  }
  readAssenza(transcription: string) {
    let keywordsAssenza = ["assenza", "tipo", "studente", "data", "orario", "concorre"];
    let transcriptionArray = transcription.split(" ");
    console.log(transcriptionArray);
    let corrispondenze = this.findKeywordsIndexes(transcriptionArray, keywordsAssenza);
    console.log(corrispondenze);
    let tipo, studente = "", data, orario, concorre;
    let assenzaOgg = new Assenza();
    let corrispondenzaAssenza = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "assenza";
    });
    if (corrispondenzaAssenza == null) {
      alert("Assenza non trovato nel comando vocale");
      return;
    }
    let corrispondenzaTipo = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "tipo";
    });

    if (corrispondenzaTipo == null) {
      alert("Tipo non trovato nel comando vocale");
      return;
    } else if (corrispondenzaTipo != "assenza" || corrispondenzaTipo != "uscita" || corrispondenzaTipo != "entrata") {
      alert("La tipologia assenza deve essere Assenza, Entrata, Uscita");
    }
    if (String(tipo) == "NaN") {
      alert("Tipo non è valido");
      return;
    }
    assenzaOgg.Tipo = tipo;
    let corrispondenzaStudente = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "studente";
    });
    console.log(corrispondenzaStudente);
    if (corrispondenzaStudente == null) {
      alert("Dato studente mancante");
      return;
    }
    else {
      let nextCorrispondenza = corrispondenze[3];
      for (let i = (corrispondenzaStudente['index'] + 1); i < nextCorrispondenza['index']; i++)
        studente += transcriptionArray[i] + " ";
      studente = studente.trim();
    }



    let corrispondenzaData = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "data";
    });

    if (corrispondenzaData != null) {
      let mesianno = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
      let giorno = Number(transcriptionArray[corrispondenzaData['index'] + 1]);
      let mese = mesianno.indexOf(transcriptionArray[corrispondenzaData['index'] + 2]);
      let anno = Number(transcriptionArray[corrispondenzaData['index'] + 3]);
      console.log(giorno, mese, anno)
      data = new Date(anno, mese, giorno);
    }
    else {
      data = new Date();
    }
    assenzaOgg.DataAssenza = data;
    let corrispondenzaOrario = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "orario";
    });
    if (corrispondenzaOrario != null && corrispondenzaTipo != "assenza") {
      let orario = String(transcriptionArray[corrispondenzaOrario['index']]);
      assenzaOgg.Ora = orario;
    }
    else
      assenzaOgg.Ora = null;
    let corrispondenzaConcorre = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "concorre";
    });
    if (corrispondenzaConcorre != null) {
      switch (transcriptionArray[corrispondenzaConcorre['index']]) {
        case ('sì'):
          assenzaOgg.Concorre = true;
          break;
        case ('no'):
          assenzaOgg.Concorre = false;
          break;
      }
    }
    else
      assenzaOgg.Tipo = String(1);
    console.log(assenzaOgg, studente);
  }
  readCircolare(transcription: string) {
    let keywordsCircolare = ["titolo", "testo", "classi"];
    let transcriptionArray = transcription.split(" ");
    console.log(transcriptionArray);
    let corrispondenze = this.findKeywordsIndexes(transcriptionArray, keywordsCircolare);
    console.log(corrispondenze);
    let titolo, testo = "", classi;
    let circolareOgg = new Comunicazione();
    let corrispondenzaCircolare = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "titolo";
    });

    if (corrispondenzaCircolare == null) {
      alert("Circolare non trovata nel comando vocale");
      return;
    } else
      titolo = transcriptionArray[corrispondenzaCircolare['index'] + 1];
    circolareOgg.Titolo = titolo;
    let corrispondenzaTesto = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "testo";
    });

    let corrispondenzaClassi = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "classi";
    });

    if (corrispondenzaTesto != null && corrispondenzaClassi != null) {
      for (let i = (corrispondenzaTesto['index'] + 1); i < corrispondenzaClassi['index']; i++)
        classi += transcriptionArray[i] + " ";

      classi = classi.trim();
    }
    else {
      alert("Dati mancanti");
      return;
    }
    circolareOgg.Destinatari = classi;
    let nextCorrispondenza = corrispondenze[3];
    if (nextCorrispondenza == undefined) {
      testo = transcriptionArray.slice(corrispondenzaTesto['index'] + 1).toString().replace(/,/g, " ").replace("\"", " ");
    }
    else {
      for (let i = corrispondenzaTesto['index'] + 1; i < nextCorrispondenza['index']; i++)
        testo += transcriptionArray[i] + " ";

      testo = testo.trim();
    }
    if (testo.length > 0) {
      circolareOgg.Testo = testo;
    }


    //console.log(circolareOgg, studente);
  }
  readFirma(transcription : string)
  {
    let keywordsFirma = ["data", "orario", "argomento"];
    let transcriptionArray = transcription.split(" ");
    console.log(transcriptionArray);
    let corrispondenze = this.findKeywordsIndexes(transcriptionArray, keywordsFirma);
    console.log(corrispondenze);
    let data, orario, argomento = "";
    let firmaOgg = new Firma();
    let corrispondenzaFirma = corrispondenze.find((corrispondenza) =>
    {
      return corrispondenza["keyword"] == "data";
    });
    if (corrispondenzaFirma != null) {
      let mesianno = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
      let giorno = Number(transcriptionArray[corrispondenzaFirma['index'] + 1]);
      let mese = mesianno.indexOf(transcriptionArray[corrispondenzaFirma['index'] + 2]);
      let anno = Number(transcriptionArray[corrispondenzaFirma['index'] + 3]);
      console.log(giorno, mese, anno)
      data = new Date(anno, mese, giorno);
    }
    else {
      data = new Date();
    }
    firmaOgg.DataFirma = data;
    let corrispondenzaOrario = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "orario";
    });
    if (corrispondenzaOrario != null) {
      let orario = String(transcriptionArray[corrispondenzaOrario['index']]);
      firmaOgg.Ora = Number(orario);
    }
    else
      firmaOgg.Ora = null;

    /*if(corrispondenzaTesto != null && corrispondenzaClassi != null)
    {
      for(let i = (corrispondenzaTesto['index'] + 1); i < corrispondenzaClassi['index']; i++)
        classi += transcriptionArray[i] + " ";

      classi = classi.trim();
    }
    else
    {
      alert("Dati mancanti");
      return;
    }
	circolareOgg.Destinatari = classi;
    let nextCorrispondenza = corrispondenze[3];
    if(nextCorrispondenza == undefined)
    {
      testo = transcriptionArray.slice(corrispondenzaTesto['index'] + 1).toString().replace(/,/g, " ").replace("\"", " ");
    }
    else
    {
      for(let i = corrispondenzaTesto['index'] + 1; i < nextCorrispondenza['index']; i++)
        testo += transcriptionArray[i] + " ";

      testo = testo.trim();
    }
	if(testo.lenght > 0)
		circolareOgg.Testo = testo;

    console.log(circolareOgg, studente);*/
  }
  receiveTranscription = (transcription: string) => {
    transcription = String(transcription.replace(/\n/g, " ").replace(/\"/g, " ")).trim();
    console.log(typeof transcription);
    transcription = transcription.toLowerCase();
    this.lasttranscription = transcription;

    //Inserimento vocale voto: Inserisci voto <1 => 10> a studente <Nome Cognome Studente> Descrizione <Descrizione> [Data <Giorno - Mese - Anno> Peso <0 - 100> {Con Valore | Senza Valore | Recupero}]
    if (!transcription.includes("Inserisci voto"))
      this.readVoto(transcription);
    else if (!transcription.includes("Inserisci nota"))
      this.readNota(transcription);
    else if (!transcription.includes("Inserisci assenza"))
      this.readAssenza(transcription);
  }

  istruzioni(istrVedi)
  {
    this.istrVedi = true;
    console.log("Istruzioni = true");
  }
}


