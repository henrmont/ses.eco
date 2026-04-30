import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowCostAssistanceComponent } from './show-cost-assistance-component';

describe('ShowCostAssistanceComponent', () => {
  let component: ShowCostAssistanceComponent;
  let fixture: ComponentFixture<ShowCostAssistanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowCostAssistanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowCostAssistanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
