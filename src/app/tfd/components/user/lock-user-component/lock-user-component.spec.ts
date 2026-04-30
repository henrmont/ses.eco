import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LockUserComponent } from './lock-user-component';

describe('LockUserComponent', () => {
  let component: LockUserComponent;
  let fixture: ComponentFixture<LockUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LockUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LockUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
