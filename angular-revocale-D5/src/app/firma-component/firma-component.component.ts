import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-firma-component',
  templateUrl: './firma-component.component.html',
  styleUrls: ['./firma-component.component.css']
})
export class FirmaComponentComponent implements OnInit {
 FormFirma: FormGroup;
  constructor() { }

  ngOnInit(): void {
  }

onSubmitFirma(){

}

}
