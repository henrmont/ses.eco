import { TestBed } from '@angular/core/testing';
import { CanActivateChildFn } from '@angular/router';

import { moduleGuard } from './module-guard';

describe('moduleGuard', () => {
  const executeGuard: CanActivateChildFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => moduleGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
