import { Component, OnInit, Input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Login } from './Login';
@Component({
  selector: 'app-login-component',
  templateUrl: './login-component.component.html',
  styleUrls: ['./login-component.component.css']
})
export class LoginComponentComponent implements OnInit {
  myForm: FormGroup;
  vettore: Login[];
  constructor(fb: FormBuilder) { //Il costruttore riceve come parametro il From Builder
    /*Diciamo al FormBuilder di creare un FormGroup che conterrà un FormControl
     *Chiamato sku, con valore di default ABC123 */
    this.myForm = fb.group({
      'username': ['username', Validators.required],
      'password': ['password', Validators.required]
    });
  }

  ngOnInit(): void {
  }
  onSubmit() {
   let l: Login = new Login();
     l.username = this.myForm.controls['username'].value;
     l.password = this.myForm.controls['password'].value;
     this.vettore.push(l);

 }

}
