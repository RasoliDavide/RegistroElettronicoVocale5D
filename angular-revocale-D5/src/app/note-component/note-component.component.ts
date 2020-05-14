import { Component, OnInit, Input } from '@angular/core';
import { ProfData } from '../prof.model';
import { SharedProfDataService } from '../shared-prof-data.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
@Component({
  selector: 'app-note-component',
  templateUrl: './note-component.component.html',
  styleUrls: ['./note-component.component.css']
})
export class NoteComponentComponent implements OnInit {
  httpClient : HttpClient;
  formNota : FormGroup;
  @Input() profData : ProfData;
  sharedProfData : SharedProfDataService;
  constructor(fb: FormBuilder,private http: HttpClient, sharedProfData : SharedProfDataService) {
    this.formNota = fb.group(
      {
      'data':['',Validators.required],
      'orario':['',Validators.required]
      }
    )
   }

  ngOnInit(): void {
     console.log('Data: ', this.formNota.controls['data'].value);
  }

}
