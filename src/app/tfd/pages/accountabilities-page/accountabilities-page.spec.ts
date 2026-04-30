import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountabilitiesPage } from './accountabilities-page';

describe('AccountabilitiesPage', () => {
  let component: AccountabilitiesPage;
  let fixture: ComponentFixture<AccountabilitiesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountabilitiesPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountabilitiesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
