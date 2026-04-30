import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchArchivePage } from './search-archive-page';

describe('SearchArchivePage', () => {
  let component: SearchArchivePage;
  let fixture: ComponentFixture<SearchArchivePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchArchivePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchArchivePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
