import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAccountabilityDailyComponent } from './create-accountability-daily-component';

describe('CreateAccountabilityDailyComponent', () => {
  let component: CreateAccountabilityDailyComponent;
  let fixture: ComponentFixture<CreateAccountabilityDailyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAccountabilityDailyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateAccountabilityDailyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
