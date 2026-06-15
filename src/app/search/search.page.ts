import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { CourseService, Course, Category } from '../services/course.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SearchPage implements OnInit {
  searchQuery: string = '';

  // Data dari API
  categories: Category[]  = [];
  searchResults: Course[] = [];

  // UI state
  isSearching: boolean   = false;
  isLoadingCats: boolean = true;
  hasSearched: boolean   = false;

  // Top searches (tetap statis, bisa diganti dari backend nanti)
  topSearches: string[] = [
    'word', 'excel', 'desain', 'musik', 'c#',
    'sql', 'python', 'php', 'cyber security'
  ];

  private readonly storageBaseUrl = environment.apiUrl.replace('/api', '/storage/');

  // Icon mapping berdasarkan nama kategori (fallback jika backend tidak sediakan icon)
  private readonly iconMap: Record<string, string> = {
    'web development':    'code-slash-outline',
    'mobile development': 'phone-portrait-outline',
    'cyber security':     'shield-checkmark-outline',
    'graphic design':     'color-palette-outline',
    'music':              'musical-notes-outline',
    'office':             'briefcase-outline',
    'data science':       'analytics-outline',
    'business':           'bar-chart-outline',
  };

  // Color mapping
  private readonly colorMap: string[] = [
    '#852920', '#2980b9', '#27ae60', '#8e44ad',
    '#d35400', '#2c3e50', '#16a085', '#c0392b'
  ];

  constructor(
    private courseService: CourseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  /** Muat daftar kategori dari API (/api/categories) */
  loadCategories() {
    this.isLoadingCats = true;
    this.courseService.getCategories().subscribe({
      next: (cats) => {
        this.categories    = cats;
        this.isLoadingCats = false;
      },
      error: () => {
        this.isLoadingCats = false;
      }
    });
  }

  /** Dipanggil setiap karakter diketik — debounce via ngModelChange */
  onSearch() {
    const q = this.searchQuery.trim();
    if (!q) {
      this.searchResults = [];
      this.hasSearched   = false;
      return;
    }
    this.doSearch(q);
  }

  /** Klik salah satu top-search pill */
  selectSearch(term: string) {
    this.searchQuery = term;
    this.doSearch(term);
  }

  /** Klik salah satu kategori — search berdasarkan category_id */
  searchByCategory(category: Category) {
    this.searchQuery = category.name;
    this.doSearch('', category.id);
  }

  /** Navigasi ke detail course */
  goToCourse(courseId: number) {
    this.router.navigate(['/detail-course', courseId]);
  }

  // ── Private helpers ────────────────────────────────────────

  private doSearch(keyword: string, categoryId?: number) {
    this.isSearching = true;
    this.hasSearched = true;

    this.courseService.searchCourses({
      q:           keyword  || undefined,
      category_id: categoryId,
      sort:        'rating',
      limit:       20,
    }).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isSearching   = false;
      },
      error: () => {
        this.searchResults = [];
        this.isSearching   = false;
      }
    });
  }

  /** Resolves thumbnail dari backend ke full URL */
  getThumbnail(course: Course): string | null {
    const raw = (course as any).thumbnail
             || (course as any).image
             || (course as any).cover_image;
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return this.storageBaseUrl + raw.replace(/^\//, '');
  }

  /** Kembalikan icon berdasarkan nama kategori */
  getCategoryIcon(name: string): string {
    const key = Object.keys(this.iconMap).find(k =>
      name.toLowerCase().includes(k)
    );
    return key ? this.iconMap[key] : 'book-outline';
  }

  /** Kembalikan warna dari colorMap berdasarkan index */
  getCategoryColor(index: number): string {
    return this.colorMap[index % this.colorMap.length];
  }

  formatPrice(price: number): string {
    if (!price || price === 0) return 'Gratis';
    return 'Rp' + price.toLocaleString('id-ID');
  }
}