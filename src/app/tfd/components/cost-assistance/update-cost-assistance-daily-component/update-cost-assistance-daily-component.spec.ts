import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateCostAssistanceDailyComponent } from './update-cost-assistance-daily-component';

describe('UpdateCostAssistanceDailyComponent', () => {
  let component: UpdateCostAssistanceDailyComponent;
  let fixture: ComponentFixture<UpdateCostAssistanceDailyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateCostAssistanceDailyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateCostAssistanceDailyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
