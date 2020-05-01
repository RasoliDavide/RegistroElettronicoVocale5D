import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VotiComponentComponent } from './voti-component.component';

describe('VotiComponentComponent', () => {
  let component: VotiComponentComponent;
  let fixture: ComponentFixture<VotiComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VotiComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VotiComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
