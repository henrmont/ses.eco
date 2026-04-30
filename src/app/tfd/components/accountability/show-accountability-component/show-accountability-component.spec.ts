import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowAccountabilityComponent } from './show-accountability-component';

describe('ShowAccountabilityComponent', () => {
  let component: ShowAccountabilityComponent;
  let fixture: ComponentFixture<ShowAccountabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowAccountabilityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowAccountabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
