import { Component, OnInit } from '@angular/core';
import * as RecordRTC from 'recordrtc';
import { DomSanitizer } from '@angular/platform-browser';
@Component({
  selector: 'app-inserimento-vocale-con-riepilogo-component',
  templateUrl: './inserimento-vocale-con-riepilogo-component.component.html',
  styleUrls: ['./inserimento-vocale-con-riepilogo-component.component.css']
})
export class InserimentoVocaleConRiepilogoComponentComponent implements OnInit {
 private record;
  //Will use this flag for detect recording
  recording = false;
  //Url of Blob
  url: string;
  private error;
  isRecording = false;
  recordedTime;
  blobUrl;
  constructor(private domSanitizer: DomSanitizer) { }
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
  }

}
