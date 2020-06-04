import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfComponentComponent } from './prof-component.component';

describe('ProfComponentComponent', () => {
  let component: ProfComponentComponent;
  let fixture: ComponentFixture<ProfComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProfComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});