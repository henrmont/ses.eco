import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeProfileInfoComponent } from './change-profile-info-component';

describe('ChangeProfileInfoComponent', () => {
  let component: ChangeProfileInfoComponent;
  let fixture: ComponentFixture<ChangeProfileInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeProfileInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangeProfileInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
