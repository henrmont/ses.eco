import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailiesCostComponent } from './dailies-cost-component';

describe('DailiesCostComponent', () => {
  let component: DailiesCostComponent;
  let fixture: ComponentFixture<DailiesCostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailiesCostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailiesCostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
