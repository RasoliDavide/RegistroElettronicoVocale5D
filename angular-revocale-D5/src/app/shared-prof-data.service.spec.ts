import { TestBed } from '@angular/core/testing';

import { SharedProfDataService } from './shared-prof-data.service';

describe('SharedProfDataService', () => {
  let service: SharedProfDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SharedProfDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
