import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-prof-component',
  templateUrl: './prof-component.component.html',
  styleUrls: ['./prof-component.component.css']
})
export class ProfComponentComponent implements OnInit {
@Input() prof: Object;
  constructor() { }

  ngOnInit(): void {
  }

}
