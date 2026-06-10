import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpAndSupportPage } from './help-and-support.page';

describe('HelpAndSupportPage', () => {
  let component: HelpAndSupportPage;
  let fixture: ComponentFixture<HelpAndSupportPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpAndSupportPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
