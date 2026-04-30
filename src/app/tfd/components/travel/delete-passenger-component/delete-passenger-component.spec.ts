import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletePassengerComponent } from './delete-passenger-component';

describe('DeletePassengerComponent', () => {
  let component: DeletePassengerComponent;
  let fixture: ComponentFixture<DeletePassengerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeletePassengerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeletePassengerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
