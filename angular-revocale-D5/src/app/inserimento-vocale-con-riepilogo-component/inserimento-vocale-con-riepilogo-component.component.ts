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
import { transcode } from 'buffer';

@Component({
  selector: 'app-inserimento-vocale-con-riepilogo-component',
  templateUrl: './inserimento-vocale-con-riepilogo-component.component.html',
  styleUrls: ['./inserimento-vocale-con-riepilogo-component.component.css']
})
@Injectable()
export class InserimentoVocaleConRiepilogoComponentComponent implements OnInit, OnDestroy {
  isRecording = false;
  caricamentoV = false;
  recordedTime;
  blobUrl;
  transcriptionObs: Observable<String>;
  lasttranscription: String;
  istrVedi = false;
  httpClient: HttpClient;
  sharedProfData: SharedProfDataService;
  constructor(private audioRecordingService: AudioRecordingService, private sanitizer: DomSanitizer, http: HttpClient, sharedProfData: SharedProfDataService) {

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
       this.caricamentoV = false;
    }
  }

  abortRecording() {
    if (this.isRecording) {
      this.isRecording = false;
      this.audioRecordingService.abortRecording();
      this.caricamentoV = false;
    }
  }

  stopRecording() {
    if (this.isRecording) {
      this.audioRecordingService.stopRecording();
      this.isRecording = false;
      this.caricamentoV = true;
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
    for (let i = 0; i < transcriptionArray.length; i++)
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
      let giorno = transcriptionArray[corrispondenzaData['index'] + 1];
      let mese = mesianno.indexOf(transcriptionArray[corrispondenzaData['index'] + 2]) + 1;
      let anno = transcriptionArray[corrispondenzaData['index'] + 3];
      if (this.isNumber(giorno) && mese && this.isNumber(anno))
        votoOgg.DataVoto = `${anno}-${mese}-${giorno}`;
      else {
        alert("Data " + anno + " " + mese + " " + giorno + " non valida");
        return;
      }
    }
    else {
      let dataTemp = new Date();
      votoOgg.DataVoto = `${dataTemp.getFullYear()}-${dataTemp.getMonth() + 1}-${dataTemp.getDate()}`;
    }

    let corrispondenzaPeso = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "peso";
    });

    if (corrispondenzaPeso != null) {
      let peso = transcriptionArray[corrispondenzaPeso['index'] + 1];
      if (this.isNumber(peso)) {
        votoOgg.Peso = this.toNumber(peso);
        if (votoOgg.Peso > 100 || votoOgg.Peso < 0) {
          alert("Il peso non è nel range consentito (0 -> 100)");
          return;
        }
      }
      else {
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
          if (votoOgg.Peso > 0 && corrispondenzaPeso) {
            alert("Se il voto non ha valore il peso deve essere 0");
            return;
          }
          else if (votoOgg.Peso > 0) {
            votoOgg.Peso = 0;
          }
          break;
        case ('recupero'):
          votoOgg.Tipologia = String(2);
          if (votoOgg.Peso > 0 && corrispondenzaPeso) {
            alert("Se il voto è di recupero il peso deve essere 0");
            return;
          }
          else if (votoOgg.Peso > 0) {
            votoOgg.Peso = 0;
          }
          break;
        default:
          alert("Tipo di voto (valore) non rilevato nel comando vocale");
          return;
          break; //Tanto non serve
      }
    }
    else
      votoOgg.Tipologia = String(1);

    console.log("263", votoOgg);
    let httpHeaders = new HttpHeaders({ "Authorization": String(this.sharedProfData.profData.securedKey) })
    let obs: Observable<Object> = this.httpClient.get(environment.node_server + `/api/stt/getUsernameByStudente?Nome=${studente.split(" ")[0]}&Cognome=${studente.split(" ")[1]}`, { headers: httpHeaders });
    let response = await this.synchronizedHTTPRequest(obs);
    if (!response['success']) {
      alert("Errore: " + JSON.stringify(response));
      return;
    }
    let username = response['recordset'][0]['Username'];
    if (!username) {
      alert("Username non trovato");
      return;
    }
    votoOgg.UsernameStudente = username;
    votoOgg.CodiceMateria = this.sharedProfData.selectedClass.CodiceMateria;
    votoOgg.CFProfessore = this.sharedProfData.profData.CFPersona;
    console.log(votoOgg);
    let observVoto = this.httpClient.post(environment.node_server + '/api/voti/inserisciVoto', votoOgg, { headers: httpHeaders });
    observVoto.subscribe(
      (response) => {
        if (response['success'])
          alert("Voto aggiunto correttamente");
        else
          alert("Errore: " + JSON.stringify(response));
      }
    )
  }
  async synchronizedHTTPRequest(obs: Observable<Object>) {
    let httpResponse = new Promise<Object>(
      (resolve, reject) => {
        obs.subscribe((response) => {
          resolve(response);
        });
      });
    let httpResult = await httpResponse;
    return httpResult;
  }

  derivateClass(trascrizioneClasse: string | String) {
    console.log("deriva classe")
    let classeArray = trascrizioneClasse.split(" ");
    console.log(trascrizioneClasse);
    console.log(classeArray)
    let tempClasse = "";
    console.log(classeArray);
    switch (classeArray[0]) {
      case ('prima'):
        tempClasse += "1";
        break;
      case ('seconda'):
        tempClasse += "2";
        break;
      case ('terza'):
        tempClasse += "3";
        break;
      case ('quarta'):
        tempClasse += "4";
        break;
      case ('quinta'):
        tempClasse += "5";
        break;
      default:
        return null;
        break;
    }
    tempClasse += classeArray[1][0];
    console.log(tempClasse)
    for (let corrispondenza of this.sharedProfData.profData.Corrispondenze) {
      if (corrispondenza.CodiceClasse.toLowerCase().includes(classeArray[1][0])) {
        return corrispondenza.CodiceClasse;
      }
    }
    return null;
  }

  async readNota(transcription: string) {
    //mandare tutto al db, fare conversione all'username, se è di classe o studente
    let keywordsNota = ["tipo", "studente", "classe", "descrizione", "penalità", "data"];
    let transcriptionArray = transcription.split(" ");
    let corrispondenze = this.findKeywordsIndexes(transcriptionArray, keywordsNota);
    let tipologia, destinatario = "", descrizione = "", data, penalita;
    let notaOgg = new Nota();
    let corrispondenzaTipo = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "tipo";
    });

    if (corrispondenzaTipo == null) {
      alert("Tipologia non trovato nel comando vocale");
      return;
    }
    else
      tipologia = transcriptionArray[corrispondenzaTipo['index'] + 1];

    if (tipologia == null) {
      alert("Tipologia non corretta");
      return;
    }
    else {
      switch (transcriptionArray[corrispondenzaTipo['index'] + 1]) {
        case ('classe'):
          notaOgg.Tipologia = Number(1);
          break;
        case ('singola'):
          notaOgg.Tipologia = Number(0);
          break;
      }
    }
    let corrispondenzaDestinatario;
    if (notaOgg.Tipologia == 0) {
      corrispondenzaDestinatario = corrispondenze.find((corrispondenza) => {
        return corrispondenza["keyword"] == "studente";
      });
    }
    else {
      corrispondenzaDestinatario = corrispondenze.find((corrispondenza) => {
        return corrispondenza["keyword"] == "classe";
      });
    }
    let corrispondenzaDescrizione = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "descrizione";
    });

    if (corrispondenzaDestinatario != null && corrispondenzaDescrizione != null) {
      for (let i = (corrispondenzaDestinatario['index'] + 1); i < corrispondenzaDescrizione['index']; i++)
        destinatario += transcriptionArray[i] + " ";
      destinatario = destinatario.trim();
      console.log(destinatario)
      if (notaOgg.Tipologia == 0) {    
        let httpHeaders = new HttpHeaders({ "Authorization": String(this.sharedProfData.profData.securedKey) })
        let obs: Observable<Object> = this.httpClient.get(environment.node_server + `/api/stt/getUsernameByStudente?Nome=${destinatario.split(" ")[0]}&Cognome=${destinatario.split(" ")[1]}`, { headers: httpHeaders });
        let response = await this.synchronizedHTTPRequest(obs);
        if (!response['success']) {
          alert("Errore: " + JSON.stringify(response));
          return;
        }
        let username = response['recordset'][0]['Username'];
        notaOgg.Destinatari = new Array<String>();
        console.log(username);
        notaOgg.Destinatari.push(username);
        if (!username) {
          alert("Username non trovato");
          return;
        }
      }
      else {
        let classeDestinataria = this.derivateClass(destinatario);
        if (classeDestinataria != null)
          notaOgg.CodiceClasse = classeDestinataria;
        else {
          alert("Classe non trovata");
          return;
        }
      }
    }
    else {
      alert("Dati mancanti");
      return;
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
      let giorno = transcriptionArray[corrispondenzaData['index'] + 1];
      let mese = mesianno.indexOf(transcriptionArray[corrispondenzaData['index'] + 2]) + 1;
      let anno = transcriptionArray[corrispondenzaData['index'] + 3];
      if (this.isNumber(giorno) && mese && this.isNumber(anno))
        data = `${anno}-${mese}-${giorno}`;
      else {
        alert("Data " + anno + " " + mese + " " + giorno + " non valida");
        return;
      }
    }
    else {
      let dataTemp = new Date();
      data = `${dataTemp.getFullYear()}-${dataTemp.getMonth()}-${dataTemp.getDate()}`;
    }
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
      notaOgg.TipoPenalita = Number(0);



    notaOgg.CFProfessore = this.sharedProfData.profData.CFPersona;
    let httpHeaders = new HttpHeaders({ "Authorization": String(this.sharedProfData.profData.securedKey) })
    let observNota = this.httpClient.post(environment.node_server + '/api/note/inserisciNota', notaOgg, { headers: httpHeaders });
    observNota.subscribe(
      (response) => {
        if (response['success'])
          alert("Nota aggiunto correttamente");
        else
          alert("Errore: " + JSON.stringify(response));
      }
    )
  }

  async readAssenza(transcription: string) {
    let keywordsAssenza = ["tipo", "studente", "data", "orario", "concorre"];
    let transcriptionArray = transcription.split(" ");
    console.log(transcriptionArray);
    let corrispondenze = this.findKeywordsIndexes(transcriptionArray, keywordsAssenza);
    let tipo, studente = "", data, orario, concorre;
    let assenzaOgg = new Assenza();
    let corrispondenzaTipo = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "tipo";
    });

    if (corrispondenzaTipo == null) {
      alert("Tipo non trovato nel comando vocale");
      return;
    }

    switch (transcriptionArray[corrispondenzaTipo['index'] + 1]) {
      case ("assenza"):
        assenzaOgg.Tipo = "A";
        assenzaOgg.Ora = undefined;
        break;
      case ("uscita"):
        assenzaOgg.Tipo = "U";
        break;
      case ("entrata"):
        assenzaOgg.Tipo = "E";
        break;
      default:
        alert("Tipo assenza non corretto.");
        return;
        break;
    }

    let corrispondenzaStudente = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "studente";
    });

    let corrispondenzaData = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "data";
    });
    console.log(corrispondenzaStudente);

    if (corrispondenzaStudente == null) {
      alert("Dato studente mancante");
      return;
    }
    else {
      for (let i = (corrispondenzaStudente['index'] + 1); i < corrispondenzaData['index']; i++)
        studente += transcriptionArray[i] + " ";

      studente = studente.trim();
    }

    if (corrispondenzaData != null) {
      let mesianno = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
      let giorno = transcriptionArray[corrispondenzaData['index'] + 1];
      let mese = mesianno.indexOf(transcriptionArray[corrispondenzaData['index'] + 2]) + 1;
      let anno = transcriptionArray[corrispondenzaData['index'] + 3];
      if (this.isNumber(giorno) && mese && this.isNumber(anno))
        data = `${anno}-${mese}-${giorno}`;
      else {
        alert("Data " + anno + " " + mese + " " + giorno + " non valida");
        return;
      }
    }
    else {
      let dataTemp = new Date();
      data = `${dataTemp.getFullYear()}-${dataTemp.getMonth()}-${dataTemp.getDate()}`;
    }
    assenzaOgg.DataAssenza = data;
    let corrispondenzaOrario = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "orario";
    });
    if (corrispondenzaOrario != null && assenzaOgg.Tipo != "A") {
      let ora = transcriptionArray[corrispondenzaOrario['index'] + 1];
      let ore = ora.split(":")[0];
      let minuti = ora.split(":")[1];
      if (ore && minuti) {
        if (this.isNumber(ore) && this.isNumber(minuti)) {
          let oreN = this.toNumber(ore);
          let minN = this.toNumber(minuti);
          if (0 <= oreN && oreN < 24 && 0 <= minN && minN < 60)
            assenzaOgg.Ora = ora;
          else {
            alert("Orario fuori range");
            return;
          }
        }
        else {
          alert("L'orario non è un numero");
          return;
        }
      }
      else {
        alert("L'orario non esiste");
        return;
      }
    }
    else if (corrispondenzaOrario != null && assenzaOgg.Tipo == "A") {
      alert("Non è possibile specificare un'ora per le assenze");
      return;
    }

    let corrispondenzaConcorre = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "concorre";
    });
    if (corrispondenzaConcorre != null) {
      switch (transcriptionArray[corrispondenzaConcorre['index'] + 1]) {
        case ('sì'):
          assenzaOgg.Concorre = true;
          break;
        case ('no'):
          assenzaOgg.Concorre = false;
          break;
      }
    }
    else
      assenzaOgg.Concorre = true;
    let httpHeaders = new HttpHeaders({ "Authorization": String(this.sharedProfData.profData.securedKey) });
    let obs: Observable<Object> = this.httpClient.get(environment.node_server + `/api/stt/getUsernameByStudente?Nome=${studente.split(" ")[0]}&Cognome=${studente.split(" ")[1]}`, { headers: httpHeaders });
    let response = await this.synchronizedHTTPRequest(obs);
    let username = response['recordset'][0]['Username'];
    if (!username) {
      alert("Username non trovato");
      return;
    }
    assenzaOgg.UsernameStudente = username;
    assenzaOgg.CFProfessore = this.sharedProfData.profData.CFPersona;
    console.log(assenzaOgg, studente);
    let observVoto = this.httpClient.post(environment.node_server + '/api/assenze/inserisciAssenza', assenzaOgg, { headers: httpHeaders });
    observVoto.subscribe(
      (response) => {
        if (response['success'])
          alert("Assenza aggiunta correttamente");
        else
          alert("Errore: " + JSON.stringify(response));
      }
    );
  }


  readCircolare(transcription: string) {
    let keywordsCircolare = ["titolo", "testo", "classi"];
    let transcriptionArray = transcription.split(" ");
    console.log(transcriptionArray);
    let corrispondenze = this.findKeywordsIndexes(transcriptionArray, keywordsCircolare);
    console.log(corrispondenze);
    let titolo = "", testo = "", destinatario = "";
    let circolareOgg = new Comunicazione();
    let corrispondenzaCircolare = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "titolo";
    });

    let corrispondenzaTesto = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "testo";
    });

    let corrispondenzaDestinatario = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "classi";
    });
    if (corrispondenzaCircolare == null && corrispondenzaTesto) {
      alert("Circolare non trovata nel comando vocale");
      return;
    }
    else {
      for (let i = (corrispondenzaCircolare['index'] + 1); i < corrispondenzaTesto['index']; i++)
        titolo += transcriptionArray[i] + " ";

      titolo = titolo.trim();
    }

    circolareOgg.Titolo = titolo;


    if (corrispondenzaTesto != null && corrispondenzaDestinatario != null) {
      for (let i = (corrispondenzaTesto['index'] + 1); i < corrispondenzaDestinatario['index']; i++) {
        testo += transcriptionArray[i] + " ";
      }
      console.log(corrispondenzaDestinatario['index']);
      testo = testo.trim();
    }
    else {
      alert("Dati mancanti");
      return;
    }
    circolareOgg.Testo = testo;
    circolareOgg.Destinatari = Array<String>();
    let destinatariTemp = transcriptionArray.slice(corrispondenzaDestinatario['index'] + 1);
    console.log(destinatariTemp)
    if (destinatariTemp.length % 2 == 0) {
      for (let i = 0; i < destinatariTemp.length; i += 2) {
        let daDerivare = (destinatariTemp[i] + " " + destinatariTemp[i + 1]);
        console.log(daDerivare)
        let classe = this.derivateClass(daDerivare);
        console.log(classe);
        if (classe != null)
          circolareOgg.Destinatari.push(classe);
        else
        {
          alert("Classe " + daDerivare + " non trovata. La comunicazione non verrà aggiunta");
          return;
        }
      }
    }
    console.log(circolareOgg);
    let httpHeaders = new HttpHeaders({ "Authorization": String(this.sharedProfData.profData.securedKey) })
    let observCirc = this.httpClient.post(environment.node_server + '/api/dirigente/inserisciComunicazione', circolareOgg, { headers: httpHeaders });
    observCirc.subscribe(
      (response) => {
        if (response['success'])
          alert("Circolare aggiunta correttamente");
        else
          alert("Errore: " + JSON.stringify(response));
      }
    );
  }

  readFirma(transcription: string) {
    let keywordsFirma = ["classe", "data", "orario", "argomento", "compiti"];
    let transcriptionArray = transcription.split(" ");
    console.log(transcriptionArray);
    let corrispondenze = this.findKeywordsIndexes(transcriptionArray, keywordsFirma);
    console.log(corrispondenze);
    let classe, data, orario, argomento = "", compiti = "";
    let firmaOgg = new Firma();
    let corrispondenzaClasse = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "classe";
    });
    if (corrispondenzaClasse != null) {
      let classeDerivare = String(transcriptionArray[corrispondenzaClasse['index']+ 1] + " " + transcriptionArray[corrispondenzaClasse['index']+ 2]);
      classe = this.derivateClass(classeDerivare);
      if(classe != null){
         firmaOgg.CodiceClasse = classe;
      }else{
          alert("Classe non trovato");
      }

    }
    else
      alert("Classe non trovato");

    let corrispondenzaData = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "data";
    });

    if (corrispondenzaData != null) {
      let mesianno = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
      let giorno = transcriptionArray[corrispondenzaData['index'] + 1];
      let mese = mesianno.indexOf(transcriptionArray[corrispondenzaData['index'] + 2]) + 1;
      let anno = transcriptionArray[corrispondenzaData['index'] + 3];
      if (this.isNumber(giorno) && mese && this.isNumber(anno))
        data = `${anno}-${mese}-${giorno}`;
      else {
        alert("Data " + anno + " " + mese + " " + giorno + " non valida");
        return;
      }
    }
    else {
      let dataTemp = new Date();
      data = `${dataTemp.getFullYear()}-${dataTemp.getMonth()}-${dataTemp.getDate()}`;
    }
    firmaOgg.DataFirma = data;
    let corrispondenzaOrario = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "orario";
    });
    if (corrispondenzaOrario != null) {
      let orario = Number(transcriptionArray[corrispondenzaOrario['index']+ 1] );
      console.log(orario);
      firmaOgg.Ora = orario;
    }
    else
      alert("Orario non trovato");

    let corrispondenzaArgomento = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "argomento";
    })
    if (corrispondenzaArgomento != null) {
      let argomento = String(transcriptionArray[corrispondenzaArgomento['index']+ 1]);
      firmaOgg.Argomento = String(argomento);
    }
    else
      alert("Argomento non trovato");

    let corrispondenzaCompiti = corrispondenze.find((corrispondenza) => {
      return corrispondenza["keyword"] == "compiti";
    })
    if (corrispondenzaCompiti != null) {
      let compiti = String(transcriptionArray[corrispondenzaCompiti['index']+ 1] );
      firmaOgg.CompitiAssegnati = String(compiti);
    }
    else
      firmaOgg.CompitiAssegnati = null;
    firmaOgg.CFProfessore = this.sharedProfData.profData.CFPersona;
    firmaOgg.CodiceMateria = this.sharedProfData.selectedClass.CodiceMateria;
    console.log(firmaOgg);
    let httpHeaders = new HttpHeaders({ "Authorization": String(this.sharedProfData.profData.securedKey) })
    let observFirma = this.httpClient.post(environment.node_server + '/api/prof/firma', firmaOgg, { headers: httpHeaders });
    observFirma.subscribe(
      (response) => {
        if (response['success'])
          alert("Firma aggiunto correttamente");
        else
          alert("Errore: " + JSON.stringify(response));
      }
    )
  }
  receiveTranscription = (transcription: string) => {
    this.caricamentoV = false;
    transcription = String(transcription.replace(/\n/g, " ").replace(/\"/g, " ")).trim();
    console.log(typeof transcription);
    transcription = transcription.toLowerCase();
    this.lasttranscription = transcription;

    //Inserimento vocale voto: Inserisci voto <1 => 10> a studente <Nome Cognome Studente> Descrizione <Descrizione> [Data <Giorno - Mese - Anno> Peso <0 - 100> {Con Valore | Senza Valore | Recupero}]
    if (transcription.includes("inserisci voto"))
      this.readVoto(transcription);
    else if (transcription.includes("inserisci nota"))
      this.readNota(transcription);
    else if (transcription.includes("inserisci assenza"))
      this.readAssenza(transcription);
    else if (transcription.includes("inserisci circolare"))
      this.readCircolare(transcription);
    else if (transcription.includes("inserisci firma"))
      this.readFirma(transcription);
  }

  istruzioni(istrVedi) {
    this.istrVedi = !this.istrVedi;
  }
}


