import { TestBed } from '@angular/core/testing';

import { FellowshipService } from './fellowship.service';

describe('FellowshipService', () => {
  let service: FellowshipService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FellowshipService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
