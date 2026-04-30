import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCostAssistanceDailyComponent } from './create-cost-assistance-daily-component';

describe('CreateCostAssistanceDailyComponent', () => {
  let component: CreateCostAssistanceDailyComponent;
  let fixture: ComponentFixture<CreateCostAssistanceDailyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCostAssistanceDailyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateCostAssistanceDailyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
