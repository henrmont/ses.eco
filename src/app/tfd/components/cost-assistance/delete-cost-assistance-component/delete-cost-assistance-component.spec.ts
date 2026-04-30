import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteCostAssistanceComponent } from './delete-cost-assistance-component';

describe('DeleteCostAssistanceComponent', () => {
  let component: DeleteCostAssistanceComponent;
  let fixture: ComponentFixture<DeleteCostAssistanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteCostAssistanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteCostAssistanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
