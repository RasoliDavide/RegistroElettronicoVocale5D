import { NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Routes, RouterModule } from '@angular/router';
import { ProfComponentComponent } from './prof-component/prof-component.component';
import { LoginComponentComponent } from './login-component/login-component.component';
import { CoordinatoreComponentComponent } from './coordinatore-component/coordinatore-component.component';
import { DirigenteComponentComponent } from './dirigente-component/dirigente-component.component';
import { VotiComponentComponent } from './voti-component/voti-component.component';
import { NoteComponentComponent } from './note-component/note-component.component';
import { AssenzeComponentComponent } from './assenze-component/assenze-component.component';
import { FirmaComponentComponent } from './firma-component/firma-component.component';
import { InserimentoVocaleConRiepilogoComponentComponent } from './inserimento-vocale-con-riepilogo-component/inserimento-vocale-con-riepilogo-component.component';

const routes: Routes = [
  { path: 'prof', component: ProfComponentComponent },
  { path: 'coordinatore', component: CoordinatoreComponentComponent },
  { path: 'dirigente', component: DirigenteComponentComponent },
  { path: 'voti', component: VotiComponentComponent },
  { path: 'note', component: NoteComponentComponent },
  { path: 'assenze', component: AssenzeComponentComponent },
  { path: 'inserimentoVocale', component: InserimentoVocaleConRiepilogoComponentComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
