import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAccountabilityComponent } from './create-accountability-component';

describe('CreateAccountabilityComponent', () => {
  let component: CreateAccountabilityComponent;
  let fixture: ComponentFixture<CreateAccountabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAccountabilityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateAccountabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
