import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidateUserComponent } from './validate-user-component';

describe('ValidateUserComponent', () => {
  let component: ValidateUserComponent;
  let fixture: ComponentFixture<ValidateUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidateUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidateUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
