import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateAccountabilityComponent } from './update-accountability-component';

describe('UpdateAccountabilityComponent', () => {
  let component: UpdateAccountabilityComponent;
  let fixture: ComponentFixture<UpdateAccountabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateAccountabilityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateAccountabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
