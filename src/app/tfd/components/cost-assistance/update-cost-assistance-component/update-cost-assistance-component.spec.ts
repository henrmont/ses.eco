import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateCostAssistanceComponent } from './update-cost-assistance-component';

describe('UpdateCostAssistanceComponent', () => {
  let component: UpdateCostAssistanceComponent;
  let fixture: ComponentFixture<UpdateCostAssistanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateCostAssistanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateCostAssistanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
