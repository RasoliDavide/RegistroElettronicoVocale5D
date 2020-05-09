import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-firma-component',
  templateUrl: './firma-component.component.html',
  styleUrls: ['./firma-component.component.css']
})
export class FirmaComponentComponent implements OnInit {
  formFirma: FormGroup;
  constructor(fb : FormBuilder) {
    this.formFirma = fb.group(
    {

    })
  }

  ngOnInit(): void {
  }

onSubmitFirma(){

}

}
