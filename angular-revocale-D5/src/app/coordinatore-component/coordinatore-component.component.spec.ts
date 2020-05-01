import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoordinatoreComponentComponent } from './coordinatore-component.component';

describe('CoordinatoreComponentComponent', () => {
  let component: CoordinatoreComponentComponent;
  let fixture: ComponentFixture<CoordinatoreComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CoordinatoreComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CoordinatoreComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
