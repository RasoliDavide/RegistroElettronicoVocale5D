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
import { environment } from 'src/environments/environment';
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
    
  }

  onSubmit() {
    this.scompare= false;
    this.loginS= true;
    let l: Login = new Login();
    l.username = this.myForm.controls['username'].value;
    l.password = sha512(this.myForm.controls['password'].value);
    this.pastaAllaCarbonara = this.http.post(environment.node_server + '/api/login', l)
    this.pastaAllaCarbonara.subscribe(
      (data) => {
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
 }
}
