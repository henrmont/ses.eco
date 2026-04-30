import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteAccountabilityDailyComponent } from './delete-accountability-daily-component';

describe('DeleteAccountabilityDailyComponent', () => {
  let component: DeleteAccountabilityDailyComponent;
  let fixture: ComponentFixture<DeleteAccountabilityDailyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteAccountabilityDailyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteAccountabilityDailyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
