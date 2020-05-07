import { Component, OnInit, Input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import{sha512} from 'js-sha512';
import { Login } from './Login.model';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-login-component',
  templateUrl: './login-component.component.html',
  styleUrls: ['./login-component.component.css']
})
export class LoginComponentComponent implements OnInit {
  myForm: FormGroup;
  scompare: boolean;

  constructor(fb: FormBuilder,private http: HttpClient) { //Il costruttore riceve come parametro il From Builder
    /*Diciamo al FormBuilder di creare un FormGroup che conterrà un FormControl
     *Chiamato sku, con valore di default ABC123 */
    this.myForm = fb.group({
      'username': ['', Validators.required],
      'password': ['', Validators.required]
    });
  }

  ngOnInit(): void {
  }
  onSubmit() {
    this.scompare= false;
    let l: Login = new Login();
    l.username = this.myForm.controls['username'].value;
    l.password = sha512(this.myForm.controls['password'].value);
    console.log(l);
    this.http.post('https://3000-fd55686c-fe67-43e1-9d74-11cde241e001.ws-eu01.gitpod.io/api/login', l).subscribe(
      l => {
        alert('ok');
        console.log(l);
        this.scompare = true;
        console.log(this.scompare);
      }
    )

 }

}
