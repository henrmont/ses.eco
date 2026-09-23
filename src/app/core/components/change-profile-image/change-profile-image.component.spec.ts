import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeProfileImageComponent } from './change-profile-image-component';

describe('ChangeProfileImageComponent', () => {
  let component: ChangeProfileImageComponent;
  let fixture: ComponentFixture<ChangeProfileImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeProfileImageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangeProfileImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
