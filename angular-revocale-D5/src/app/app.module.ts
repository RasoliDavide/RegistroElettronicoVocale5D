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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgAlertModule } from '@theo4u/ng-alert';
import {MatIconModule} from '@angular/material/icon';
import { AudioRecordingService } from './inserimento-vocale-con-riepilogo-component/audio-recording.service';

@NgModule({
  exports: [
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
    BrowserAnimationsModule,
    NgAlertModule,
    MatIconModule

  ],
  providers: [AudioRecordingService],
  bootstrap: [AppComponent]
})
export class AppModule { }
