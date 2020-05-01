import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DirigenteComponentComponent } from './dirigente-component.component';

describe('DirigenteComponentComponent', () => {
  let component: DirigenteComponentComponent;
  let fixture: ComponentFixture<DirigenteComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DirigenteComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DirigenteComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
