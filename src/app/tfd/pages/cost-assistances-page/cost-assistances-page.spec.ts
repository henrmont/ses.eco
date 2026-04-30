import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostAssistancesPage } from './cost-assistances-page';

describe('CostAssistancesPage', () => {
  let component: CostAssistancesPage;
  let fixture: ComponentFixture<CostAssistancesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CostAssistancesPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CostAssistancesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
