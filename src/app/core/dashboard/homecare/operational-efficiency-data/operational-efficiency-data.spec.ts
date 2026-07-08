import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationalEfficiencyData } from './operational-efficiency-data';

describe('OperationalEfficiencyData', () => {
  let component: OperationalEfficiencyData;
  let fixture: ComponentFixture<OperationalEfficiencyData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationalEfficiencyData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperationalEfficiencyData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
