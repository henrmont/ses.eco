import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeProfileModuleComponent } from './change-profile-module-component';

describe('ChangeProfileModuleComponent', () => {
  let component: ChangeProfileModuleComponent;
  let fixture: ComponentFixture<ChangeProfileModuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeProfileModuleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangeProfileModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
