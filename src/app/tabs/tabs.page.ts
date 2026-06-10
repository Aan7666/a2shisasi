import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { addIcons } from 'ionicons';
import {
  home, homeOutline,
  search, searchOutline,
  heart, heartOutline,
  person, personOutline,
  book, bookOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: false,
})
export class TabsPage implements OnInit {

  activeTab: string = 'home';
  isLoggedIn: boolean = false;

  readonly TAB_BAR_HEIGHT = 60;
  readonly BANNER_HEIGHT = 42;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      'home': home, 'home-outline': homeOutline,
      'search': search, 'search-outline': searchOutline,
      'heart': heart, 'heart-outline': heartOutline,
      'person': person, 'person-outline': personOutline,
      'book': book, 'book-outline': bookOutline
    });
  }

  ngOnInit() {
    this.isLoggedIn = !!localStorage.getItem('token');
    this.updateBottomOffset();
  }

  tabChanged(event: any) {
    this.activeTab = event.tab;
    this.updateBottomOffset();
    this.cdr.detectChanges();
  }

  navigateToCourses() {
    this.router.navigate(['/tabs/courses']);
  }

  redirectToLogin() {
    this.router.navigate(['/login']);
  }

  private updateBottomOffset() {
    const showBanner = !this.isLoggedIn && this.activeTab !== 'profile';
    const totalOffset = this.TAB_BAR_HEIGHT + (showBanner ? this.BANNER_HEIGHT : 0);
    document.documentElement.style.setProperty('--bottom-offset', `${totalOffset}px`);
  }
}