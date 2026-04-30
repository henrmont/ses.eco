import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostAssistanceVsAccountabilityData } from './cost-assistance-vs-accountability-data';

describe('CostAssistanceVsAccountabilityData', () => {
  let component: CostAssistanceVsAccountabilityData;
  let fixture: ComponentFixture<CostAssistanceVsAccountabilityData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CostAssistanceVsAccountabilityData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CostAssistanceVsAccountabilityData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
