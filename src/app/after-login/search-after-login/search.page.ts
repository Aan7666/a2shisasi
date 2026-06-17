import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { CourseService, Course } from '../../services/course.service';
import { environment } from '../../../environments/environment';

interface Category {
  id?: number;
  title: string;
  icon: string;
  color: string;
  background: string;
}

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SearchPage implements OnInit {
  searchQuery: string = '';
  categories: Category[] = [];
  isLoadingCats: boolean = true;

  // Filter States
  selectedSort: string = 'Top Rating';
  isSortDropdownOpen: boolean = false;
  sortOptions: string[] = ['Top Rating', 'Newest', 'Lowest Price', 'Highest Price'];
  selectedPrice: string = 'Paid';
  ratingFilters = [
    { value: 5, label: '5', checked: false },
    { value: 4, label: '≥ 4', checked: false },
    { value: 3, label: '≥ 3', checked: false },
    { value: 2, label: '≥ 2', checked: false },
    { value: 1, label: '≥ 1', checked: false }
  ];

  searchResults: Course[] = [];
  isSearching: boolean = false;
  hasSearched: boolean = false;
  private readonly storageBaseUrl = environment.apiUrl.replace('/api', '/storage/');

  private readonly iconMap: Record<string, string> = {
    'teknologi': 'code-slash-outline',
    'pemrograman': 'code-slash-outline',
    'web development': 'code-slash-outline',
    'mobile development': 'phone-portrait-outline',
    'desain': 'color-palette-outline',
    'kreatif': 'color-palette-outline',
    'graphic design': 'color-palette-outline',
    'bisnis': 'briefcase-outline',
    'entrepreneurship': 'briefcase-outline',
    'office': 'briefcase-outline',
    'data': 'analytics-outline',
    'analitik': 'analytics-outline',
    'data science': 'analytics-outline',
    'bahasa': 'language-outline',
    'pengembangan': 'trending-up-outline',
    'diri': 'trending-up-outline',
  };

  private readonly colorMap: string[] = [
    '#2980b9', '#8e44ad', '#2c3e50', '#27ae60', '#e67e22', '#852920'
  ];

  constructor(
    private courseService: CourseService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoadingCats = true;
    this.courseService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats.map((cat, index) => ({
          id: cat.id,
          title: cat.name,
          icon: this.getCategoryIcon(cat.name),
          color: this.getCategoryColor(index),
          background: this.getCategoryColor(index) + '14' // hex 8% opacity
        }));
        this.isLoadingCats = false;
      },
      error: () => {
        this.isLoadingCats = false;
      }
    });
  }

  getCategoryIcon(name: string): string {
    const key = Object.keys(this.iconMap).find(k =>
      name.toLowerCase().includes(k)
    );
    return key ? this.iconMap[key] : 'book-outline';
  }

  getCategoryColor(index: number): string {
    return this.colorMap[index % this.colorMap.length];
  }

  onSearch() {
    const q = this.searchQuery.trim();
    if (!q) {
      this.searchResults = [];
      this.hasSearched = false;
      return;
    }
    this.doSearch(q);
  }

  selectCategory(cat: Category) {
    this.searchQuery = cat.title;
    this.doSearch('', cat.id);
  }

  goToCourse(courseId: number) {
    this.router.navigate(['/detail-course', courseId]);
  }

  private doSearch(keyword: string, categoryId?: number) {
    this.isSearching = true;
    this.hasSearched = true;

    this.courseService.searchCourses({
      q: keyword || undefined,
      category_id: categoryId,
      sort: 'rating',
      limit: 20
    }).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isSearching = false;
      },
      error: () => {
        this.searchResults = [];
        this.isSearching = false;
      }
    });
  }

  getThumbnail(course: Course): string | null {
    const raw = course.thumbnail || course.image || course.cover_image;
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return this.storageBaseUrl + raw.replace(/^\//, '');
  }

  formatPrice(price: number): string {
    if (!price || price === 0) return 'Gratis';
    return 'Rp' + price.toLocaleString('id-ID');
  }

  // Filter Methods
  toggleSortDropdown() {
    this.isSortDropdownOpen = !this.isSortDropdownOpen;
  }

  selectSortOption(option: string) {
    this.selectedSort = option;
    this.isSortDropdownOpen = false;
  }

  selectPrice(price: string) {
    this.selectedPrice = this.selectedPrice === price ? '' : price;
  }

  toggleRatingFilter(rate: any) {
    rate.checked = !rate.checked;
  }

  resetFilters() {
    this.selectedSort = 'Top Rating';
    this.isSortDropdownOpen = false;
    this.selectedPrice = 'Paid';
    this.ratingFilters.forEach(r => r.checked = false);
  }

  applyFilters() {
    console.log('Applying Filters:', {
      sort: this.selectedSort,
      price: this.selectedPrice,
      ratings: this.ratingFilters.filter(r => r.checked).map(r => r.value)
    });
  }
}