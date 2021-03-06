
import { Injectable, NgZone } from '@angular/core';
import * as RecordRTC from 'recordrtc';
import * as moment from 'moment';
import { Observable, Subject } from 'rxjs';
import { isNullOrUndefined } from 'util';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { SharedProfDataService } from '../shared-prof-data.service';
interface RecordedAudioOutput {
  blob: Blob;
  title: string;
}

@Injectable()
export class AudioRecordingService {
  private stream;
  private recorder;
  private interval;
  private startTime;
  private _recorded = new Subject<RecordedAudioOutput>();
  private _recordingTime = new Subject<string>();
  private _recordingFailed = new Subject<string>();
  private httpClient : HttpClient;
  private transcriptionSbj : Subject<String>;
  sharedProfData : SharedProfDataService;
  constructor(http : HttpClient, sharedProfData : SharedProfDataService)
  {
    this.httpClient = http;
    this.transcriptionSbj = new Subject<String>();
    this.sharedProfData = sharedProfData;
  }
  getRecordedBlob(): Observable<RecordedAudioOutput> {
    return this._recorded.asObservable();
  }

  getRecordedTime(): Observable<string> {
    return this._recordingTime.asObservable();
  }

  recordingFailed(): Observable<string> {
    return this._recordingFailed.asObservable();
  }


  startRecording() {

    if (this.recorder) {
      return;
    }

    this._recordingTime.next('00:00');
    navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
      this.stream = s;
      this.record();
    }).catch(error => {
      this._recordingFailed.next();
    });
  }

  abortRecording() {
    this.stopMedia();
  }

  private record() {

    this.recorder = new RecordRTC.StereoAudioRecorder(this.stream, {
      type: 'audio',
      mimeType: 'audio/wav;codecs=PCM',
      desiredSampRate: 16000,
      audioBitsPerSecond: 16000,
      numberOfAudioChannels: 1
    });

    this.recorder.record();
    this.startTime = moment();
    this.interval = setInterval(
      () => {
        const currentTime = moment();
        const diffTime = moment.duration(currentTime.diff(this.startTime));
        const time = this.toString(diffTime.minutes()) + ':' + this.toString(diffTime.seconds());
        this._recordingTime.next(time);
      },
      1000
    );
  }

  private toString(value) {
    let val = value;
    if (!value) {
      val = '00';
    }
    if (value < 10) {
      val = '0' + value;
    }
    return val;
  }

  stopRecording() {

    if (this.recorder) {
      this.recorder.stop(async (blob) => {
        if (this.startTime) {
          this.stopMedia();
          var reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () =>
          {
            var b64 = reader.result;
            b64 = b64.toString().substring(22);
            let send = {"audio" : b64};
            let httpHead = new HttpHeaders({Authorization : String(this.sharedProfData.profData.securedKey)});
            this.httpClient.post<String>(environment.node_server + '/api/stt', send, { headers: httpHead }).subscribe((resp) =>
            {
              console.log(resp);
              let stringToSend : String = String(JSON.stringify(resp['transcription']));
              this.transcriptionSbj.next(stringToSend);
            })
          }
        }
      }, () => {
        this.stopMedia();
        this._recordingFailed.next();
      });
    }
  }

  private stopMedia() {
    if (this.recorder) {
      this.recorder = null;
      clearInterval(this.interval);
      this.startTime = null;
      if (this.stream) {
        this.stream.getAudioTracks().forEach(track => track.stop());
        this.stream = null;
      }
    }
  }
  getTranscriptionObservable() : Observable<String>
  {
    return this.transcriptionSbj.asObservable();
  }
}
