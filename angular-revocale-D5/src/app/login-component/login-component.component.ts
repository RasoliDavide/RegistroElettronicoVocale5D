import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { sha512 } from 'js-sha512';
import { Login } from './Login.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-login-component',
  templateUrl: './login-component.component.html',
  styleUrls: ['./login-component.component.css']
})
export class LoginComponentComponent implements OnInit {
  myForm: FormGroup;
  scompare: boolean;
  loginS: boolean;
  pastaAllaCarbonara :Observable<Object>;
  @Output() loginOk : EventEmitter<Object>;

  constructor(fb: FormBuilder,private http: HttpClient) {
    this.myForm = fb.group({
      'username': ['', Validators.required],
      'password': ['', Validators.required]
    });
    this.loginS = true;
    this.loginOk = new EventEmitter<Object>();
  }

  ngOnInit(): void
  {
    let l: Login = new Login();
    l.username = "Admin";
    l.password = "99da612880312b6db4c7ee8048326fcfd7ca4fff90048bd1f897d02c515d2b7f083e3fd1f830841a59f810ce8ab27c34cbfdb9cdf4f7a303940300340990d6eb";
    //console.log(l);
    this.pastaAllaCarbonara = this.http.post('https://3000-fd55686c-fe67-43e1-9d74-11cde241e001.ws-eu01.gitpod.io/api/login', l)
    this.pastaAllaCarbonara.subscribe(
      (data) => {
        this.scompare = true;
        this.loginS = false;
        this.loginOk.emit(data);
      }
    )
  }

  onSubmit() {
    this.scompare= false;
    this.loginS= true;
    let l: Login = new Login();
    l.username = this.myForm.controls['username'].value;
    l.password = sha512(this.myForm.controls['password'].value);
    //console.log(l);
    this.pastaAllaCarbonara = this.http.post('https://3000-fd55686c-fe67-43e1-9d74-11cde241e001.ws-eu01.gitpod.io/api/login', l)
    this.pastaAllaCarbonara.subscribe(
      (data) => {
        //alert('ok');
        if(data['securedKey'])
        {
          console.log(data);
          this.scompare = true;
          this.loginS = false;
          console.log(this.scompare);
          this.loginOk.emit(data);
        }

      }
    )
    //this.pastaAllaCarbonara.subscribe((data) => this.datiProf = data);
    //Se fate 2 subscribe vengono inviate 2 richiesta al server node.
 }

}
