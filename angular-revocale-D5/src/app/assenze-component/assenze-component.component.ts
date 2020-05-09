import { Component, OnInit, Input } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Classi } from '../classi.model';
import { ProfData } from '../prof.model';
import { SharedProfDataService } from '../shared-prof-data.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
@Component({
  selector: 'app-assenze-component',
  templateUrl: './assenze-component.component.html',
  styleUrls: ['./assenze-component.component.css']
})
export class AssenzeComponentComponent implements OnInit {
  httpClient : HttpClient;
  obsAssenze : Observable<Object>;
  Classi: Classi;
  giustificaV = false;
  FormGiustifica: FormGroup;
  FormAssenza:FormGroup;
  selectedOption: string;
  selectedOrario:string;
  selectedData: string;
  tipoG : string;
  tipoO : string;
  tipoD : string;
  @Input() profData : ProfData;
  sharedProfData : SharedProfDataService;
  constructor(fb: FormBuilder,private http: HttpClient, sharedProfData : SharedProfDataService)
  {
    this.httpClient = http;
    this.sharedProfData = sharedProfData;


     this.FormGiustifica = fb.group({
      firstName: new FormControl(),
      'motivazione': ['', Validators.required]
    });
  }



  ngOnInit(): void
  {
    this.profData = this.sharedProfData.profData;
    console.log(this.profData);
  }

  giustifica(){
    this.giustificaV  = true;
  }
onSubmitAssenza(){

}
  onSubmitGiustifica(){
    //da mandare
      this.tipoG = this.selectedOption;
      this.tipoO = this.selectedOrario;
      this.tipoD =this.selectedData;

  }
/*
  getStudenti(profProv : Object)
  {
    console.log(profProv)
    let httpHead = new HttpHeaders({Authorization : profProv['securedKey']});
    this.httpClient.get<Classi[]>(`https://3000-fd55686c-fe67-43e1-9d74-11cde241e001.ws-eu01.gitpod.io/api/getStudentiByClasse?codiceClasse=${profProv['CodiceClasse']}`, {headers : httpHead})
    .subscribe((response) =>
    {

    })

}
*/
}
