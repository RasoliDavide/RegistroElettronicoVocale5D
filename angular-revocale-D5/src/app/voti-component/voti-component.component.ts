import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Classi } from '../classi.model';
import { ProfData } from '../prof.model';
import { SharedProfDataService } from '../shared-prof-data.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Studente } from '../studente.model';
import { Voti } from '../voti.model';
@Component({
  selector: 'app-voti-component',
  templateUrl: './voti-component.component.html',
  styleUrls: ['./voti-component.component.css']
})
export class VotiComponentComponent implements OnInit {
  httpClient : HttpClient;
  concorreSelect : boolean;
  pesoSelect: boolean;
  @Input() profData : ProfData;
  @Input() studente : Studente;
  selectedVoto: string = '';
  selectedPeso: string = '';
  sharedProfData : SharedProfDataService;
  @Output() votoOK : EventEmitter<Object>;
  formVoto:FormGroup;
  constructor(fb: FormBuilder,private http: HttpClient, sharedProfData : SharedProfDataService)
  {
    this.httpClient = http;
    this.sharedProfData = sharedProfData;
    this.formVoto = fb.group(
      {
      'voto':['',Validators.required],
      'descrizione':['',Validators.required]

      }
    )
  }

  ngOnInit(): void {
    this.profData = this.sharedProfData.profData;
  }
  selectChangeHandler (event: any) {
    this.selectedVoto = event.target.value;
    this.selectedPeso = event.target.value;
  }
  toggleEditable(event) {
    if ( event.target.checked ) {
         this.concorreSelect = true;
         this.pesoSelect = true;
    }else{
         this.concorreSelect = false;
         this.pesoSelect = false;
    }
  }
  onSubmitVoto(value: string): void {
    console.log('Voto: ', this.formVoto.controls['voto'].value);
    console.log('Descrizione: ', this.formVoto.controls['descrizione'].value);
    /*let v: Voti = new Voti();
    v.tipo = this.selectedVoto;
    if(v.tipo == 0){
      a.Data = this.formVoto.controls['data'].value;
      a.Ora = null;
      a.Concorre =this.concorreSelect;
      //a.CFStudente
      //a.CFProfessore
    }else{
      a.Data = this.formAssenza.controls['data'].value;
      a.Ora = this.formAssenza.controls['orario'].value;
      a.Concorre =this.concorreSelect;
      //a.CFStudente
      //a.CFProfessore*/
    }
  }



