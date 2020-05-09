import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ProfComponentComponent } from './prof-component/prof-component.component';
import { LoginComponentComponent } from './login-component/login-component.component';
import { CoordinatoreComponentComponent } from './coordinatore-component/coordinatore-component.component';
import { DirigenteComponentComponent } from './dirigente-component/dirigente-component.component';
import { VotiComponentComponent } from './voti-component/voti-component.component';
import { NoteComponentComponent } from './note-component/note-component.component';
import { AssenzeComponentComponent } from './assenze-component/assenze-component.component';
import { FirmaComponentComponent } from './firma-component/firma-component.component';
import { InserimentoVocaleConRiepilogoComponentComponent } from './inserimento-vocale-con-riepilogo-component/inserimento-vocale-con-riepilogo-component.component';
import {   //Importare le funzionalità nella nostra applicazione
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatFormFieldModule,
} from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatRippleModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import {BrowserAnimationsModule} from
    '@angular/platform-browser/animations';
@NgModule({
  exports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRippleModule,
  ],
  declarations: [
    AppComponent,
    ProfComponentComponent,
    LoginComponentComponent,
    CoordinatoreComponentComponent,
    DirigenteComponentComponent,
    VotiComponentComponent,
    NoteComponentComponent,
    AssenzeComponentComponent,
    FirmaComponentComponent,
    InserimentoVocaleConRiepilogoComponentComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatButtonModule,
    MatInputModule,
    MatRippleModule,
    MatSelectModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
