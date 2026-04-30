import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostAssistanceDailiesComponent } from './cost-assistance-dailies-component';

describe('CostAssistanceDailiesComponent', () => {
  let component: CostAssistanceDailiesComponent;
  let fixture: ComponentFixture<CostAssistanceDailiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CostAssistanceDailiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CostAssistanceDailiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
