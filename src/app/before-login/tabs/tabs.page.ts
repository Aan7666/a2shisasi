import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton
} from '@ionic/angular/standalone';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { addIcons } from 'ionicons';
import {
  home, homeOutline,
  search, searchOutline,
  heart, heartOutline,
  person, personOutline,
  book, bookOutline
} from 'ionicons/icons';

import { HomePageModule } from '../home/home.module';
import { WishlistPage } from '../wishlist/wishlist.page';
import { CoursesPage } from '../courses/courses.page';
import { SearchPage } from '../search/search.page';
import { ProfilePage } from '../profile/profile.page';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    HomePageModule,
    WishlistPage,
    CoursesPage,
    SearchPage,
    ProfilePage
  ]
})
export class TabsPage implements OnInit, OnDestroy {

  activeTab: string = 'home';
  isLoggedIn: boolean = false;
  private routerSub!: Subscription;

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

    // Sync tab when route changes
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.syncTabWithUrl();
    });
  }

  ngOnInit() {
    this.isLoggedIn = !!(localStorage.getItem('token') || localStorage.getItem('a2shi_token'));
    this.syncTabWithUrl();
    this.updateBottomOffset();
  }

  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  syncTabWithUrl() {
    const url = this.router.url;
    if (url.includes('/home')) {
      this.activeTab = 'home';
    } else if (url.includes('/wishlist')) {
      this.activeTab = 'wishlist';
    } else if (url.includes('/courses')) {
      this.activeTab = 'courses';
    } else if (url.includes('/search')) {
      this.activeTab = 'search';
    } else if (url.includes('/profile')) {
      this.activeTab = 'profile';
    }
    this.cdr.detectChanges();
  }

  selectTab(tab: string) {
    this.activeTab = tab;
    this.router.navigate([`/tabs/${tab}`]);
    this.updateBottomOffset();
    this.cdr.detectChanges();
  }

  navigateToCourses() {
    this.selectTab('courses');
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