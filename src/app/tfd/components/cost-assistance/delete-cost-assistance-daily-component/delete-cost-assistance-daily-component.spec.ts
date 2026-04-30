import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteCostAssistanceDailyComponent } from './delete-cost-assistance-daily-component';

describe('DeleteCostAssistanceDailyComponent', () => {
  let component: DeleteCostAssistanceDailyComponent;
  let fixture: ComponentFixture<DeleteCostAssistanceDailyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteCostAssistanceDailyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteCostAssistanceDailyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
