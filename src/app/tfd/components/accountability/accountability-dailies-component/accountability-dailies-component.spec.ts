import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountabilityDailiesComponent } from './accountability-dailies-component';

describe('AccountabilityDailiesComponent', () => {
  let component: AccountabilityDailiesComponent;
  let fixture: ComponentFixture<AccountabilityDailiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountabilityDailiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountabilityDailiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
