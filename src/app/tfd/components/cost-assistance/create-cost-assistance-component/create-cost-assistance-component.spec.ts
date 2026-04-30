import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCostAssistanceComponent } from './create-cost-assistance-component';

describe('CreateCostAssistanceComponent', () => {
  let component: CreateCostAssistanceComponent;
  let fixture: ComponentFixture<CreateCostAssistanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCostAssistanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateCostAssistanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
