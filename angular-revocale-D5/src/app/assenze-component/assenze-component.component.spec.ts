import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssenzeComponentComponent } from './assenze-component.component';

describe('AssenzeComponentComponent', () => {
  let component: AssenzeComponentComponent;
  let fixture: ComponentFixture<AssenzeComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AssenzeComponentComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssenzeComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
