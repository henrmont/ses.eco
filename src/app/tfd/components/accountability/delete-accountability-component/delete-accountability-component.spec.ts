import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteAccountabilityComponent } from './delete-accountability-component';

describe('DeleteAccountabilityComponent', () => {
  let component: DeleteAccountabilityComponent;
  let fixture: ComponentFixture<DeleteAccountabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteAccountabilityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteAccountabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
