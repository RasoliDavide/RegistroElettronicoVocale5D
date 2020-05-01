import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteComponentComponent } from './note-component.component';

describe('NoteComponentComponent', () => {
  let component: NoteComponentComponent;
  let fixture: ComponentFixture<NoteComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NoteComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoteComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
