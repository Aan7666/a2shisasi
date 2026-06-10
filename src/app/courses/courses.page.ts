import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-courses',
  templateUrl: 'courses.page.html',
  styleUrls: ['courses.page.scss'],
  standalone: false,
})
export class CoursesPage implements OnInit {
  isLoggedIn: boolean = false;
  isSearchMode: boolean = false;
  searchQuery: string = '';
  coursesItems: any[] = [];
  filteredItems: any[] = [];
  isActionSheetOpen: boolean = false;

  public actionSheetButtons = [
    {
      text: 'In Progress',
      handler: () => { this.filterCourses('progress'); }
    },
    {
      text: 'Completed',
      handler: () => { this.filterCourses('completed'); }
    },
    {
      text: 'Archived Courses',
      handler: () => { this.filterCourses('archived'); }
    },
    {
      text: 'All Courses',
      handler: () => { this.filterCourses('all'); }
    },
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => { this.setActionSheetOpen(false); }
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.checkLoginStatus();
  }

  ionViewWillEnter() {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  redirectToLogin() {
    this.router.navigate(['/login']);
  }

  openFilterSheet() {
    this.setActionSheetOpen(true);
  }

  setActionSheetOpen(isOpen: boolean) {
    this.isActionSheetOpen = isOpen;
  }

  filterCourses(category: string) {
    console.log('Menyaring kursus berdasarkan:', category);
    this.setActionSheetOpen(false);
    if (category === 'all') {
      this.filteredItems = [...this.coursesItems];
    } else {
      this.filteredItems = this.coursesItems.filter(item => item.status === category);
    }
  }

  toggleSearch() {
    this.isSearchMode = !this.isSearchMode;
    if (!this.isSearchMode) {
      this.searchQuery = '';
      this.onSearch();
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.onSearch();
  }
  onSearch() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredItems = [...this.coursesItems];
    } else {
      this.filteredItems = this.coursesItems.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.instructor.toLowerCase().includes(query)
      );
    }
  }
}