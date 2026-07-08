import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesUserComponent } from './roles-user-component';

describe('RolesUserComponent', () => {
  let component: RolesUserComponent;
  let fixture: ComponentFixture<RolesUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RolesUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
