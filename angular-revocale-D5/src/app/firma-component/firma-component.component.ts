import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ProfData } from '../prof.model';
import { SharedProfDataService } from '../shared-prof-data.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-firma-component',
  templateUrl: './firma-component.component.html',
  styleUrls: ['./firma-component.component.css']
})
export class FirmaComponentComponent implements OnInit {
  formFirma: FormGroup;
  httpClient : HttpClient;
  @Input() profData : ProfData;
  sharedProfData : SharedProfDataService;
  constructor(fb : FormBuilder,private http: HttpClient, sharedProfData : SharedProfDataService) {
    this.httpClient = http;
    this.sharedProfData = sharedProfData;
    this.formFirma = fb.group(
    {
      'data':['',Validators.required],
      'ora':['',Validators.required],
      'argomento':['',Validators.required],
      'compiti':['',Validators.required]
    })
  }

  ngOnInit(): void {
    this.profData = this.sharedProfData.profData;
    console.log(this.profData);
  }

  onSubmitFirma(){
      console.log('Data: ', this.formFirma.controls['data'].value);
      console.log('Ora: ', this.formFirma.controls['ora'].value);
      console.log('Ora: ', this.formFirma.controls['argomento'].value);
      console.log('Ora: ', this.formFirma.controls['compiti'].value);
//manca api
  }

}
