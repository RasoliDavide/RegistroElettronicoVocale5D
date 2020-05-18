import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ProfData } from '../prof.model';
import { SharedProfDataService } from '../shared-prof-data.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Comunicazione } from '../comunicazione.model';

@Component({
  selector: 'app-dirigente-component',
  templateUrl: './dirigente-component.component.html',
  styleUrls: ['./dirigente-component.component.css']
})
export class DirigenteComponentComponent implements OnInit {
  formDirigente: FormGroup;
  httpClient : HttpClient;
  @Input() profData : ProfData;
  sharedProfData : SharedProfDataService;
  constructor(fb : FormBuilder,private http: HttpClient, sharedProfData : SharedProfDataService) {
    this.httpClient = http;
    this.sharedProfData = sharedProfData;
    this.formDirigente = fb.group(
    {
      'titolo':['',Validators.required],
      'testo':['',Validators.required]
    })
  }

  ngOnInit(): void {
    this.profData = this.sharedProfData.profData;
    console.log(this.profData);
  }

  onSubmitComunicazione(){
      console.log('titolo: ', this.formDirigente.controls['titolo'].value);
      console.log('testo: ', this.formDirigente.controls['testo'].value);
      let comunicazioneOgg:Comunicazione = new Comunicazione();
      comunicazioneOgg.Titolo= this.formDirigente.controls['titolo'].value;
      comunicazioneOgg.Testo = this.formDirigente.controls['testo'].value;
      //this.formDirigente.reset();
  }

}
