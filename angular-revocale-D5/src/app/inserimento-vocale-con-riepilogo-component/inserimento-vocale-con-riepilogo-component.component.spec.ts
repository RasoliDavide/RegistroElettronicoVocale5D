import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InserimentoVocaleConRiepilogoComponentComponent } from './inserimento-vocale-con-riepilogo-component.component';

describe('InserimentoVocaleConRiepilogoComponentComponent', () => {
  let component: InserimentoVocaleConRiepilogoComponentComponent;
  let fixture: ComponentFixture<InserimentoVocaleConRiepilogoComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InserimentoVocaleConRiepilogoComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InserimentoVocaleConRiepilogoComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
