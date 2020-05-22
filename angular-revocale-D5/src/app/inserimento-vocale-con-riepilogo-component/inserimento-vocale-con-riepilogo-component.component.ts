import { Component, OnInit } from '@angular/core';
import * as RecordRTC from 'recordrtc';
import { DomSanitizer } from '@angular/platform-browser';
import { OnDestroy } from '@angular/core';
import { AudioRecordingService } from './audio-recording.service';
import { Injectable } from '@angular/core';


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
    /*const toBase64 = mp3Name => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(mp3Name);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });

    async function Main() {
      //const file = document.querySelector('#myfile').files[0];
     // console.log(await toBase64(file));
    }

    Main();*/



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

}
