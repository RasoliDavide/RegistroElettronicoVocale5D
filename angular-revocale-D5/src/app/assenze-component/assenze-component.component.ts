import { Component, OnInit, Input } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Classi } from '../classi.model';
import { ProfData } from '../prof.model';
import { SharedProfDataService } from '../shared-prof-data.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Studente } from '../studente.model';
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
  formGiustifica: FormGroup;
  formAssenza:FormGroup;
  selectedOption: string;
  selectedOrario:string;
  selectedData: string;
  tipoG : string;
  tipoO : string;
  tipoD : string;
  @Input() profData : ProfData;
  @Input() studente : Studente;
  selectedAssenza: string = '';
  sharedProfData : SharedProfDataService;
  constructor(fb: FormBuilder,private http: HttpClient, sharedProfData : SharedProfDataService)
  {
    this.httpClient = http;
    this.sharedProfData = sharedProfData;
    this.formAssenza = fb.group(
      {

      }
    )
     this.formGiustifica = fb.group({
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
    console.log("GiustificaV = true");
  }
  selectChangeHandler (event: any) {
    this.selectedAssenza = event.target.value;
  }

  onSubmitAssenza(value: string): void {
    console.log('Tipo Assenza: ', this.selectedAssenza);
    console.log('Data: ', this.formAssenza.controls['data'].value);
    console.log('Orario: ', this.formAssenza.controls['orario'].value);
    console.log('Concorre: ', this.formAssenza.controls['concorre'].value);
  }
  onSubmitGiustifica(value: string): void{
    console.log('Motivazione: ', this.formAssenza.controls['motivazione'].value);
  }

  getStudenti(studente : Object)
  {
    console.log(studente)
    let httpHead = new HttpHeaders({Authorization : studente['securedKey']});
    this.httpClient.get<Studente[]>(`https://3000-fd55686c-fe67-43e1-9d74-11cde241e001.ws-eu01.gitpod.io/api/getStudentiByClasse?codiceClasse=${studente['CodiceClasse']}`, {headers : httpHead})
    .subscribe((response) =>
    {
      //Cognome,Nome,Username
      this.studente.Cognome = studente['Cognome'];
      this.studente.Nome = studente['Nome'];
      this.studente.Username = studente['Username'];

    })
  }

}
