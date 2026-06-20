import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CourseService, Course, CategorySection } from '../services/course.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  isLoggedIn: boolean = false;
  userName: string = 'User';

  trendingCourses: Course[] = [];
  categorySections: CategorySection[] = [];
  newestCourses: Course[] = [];
  categories: any[] = [];
  isLoading: boolean = true;
  hasError: boolean = false;

  /** Max courses shown per section on home */
  private readonly SECTION_LIMIT = 6;

  private readonly storageBaseUrl = environment.apiUrl.replace('/api', '/storage/');

  constructor(
    private authService: AuthService,
    private router: Router,
    private courseService: CourseService
  ) { }

  ngOnInit() {
    this.checkLoginStatus();
  }

  ionViewWillEnter() {
    this.checkLoginStatus();
    this.loadHomeData();
  }

  checkLoginStatus() {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      const currentUser = this.authService.getCurrentUser();
      this.userName = currentUser ? currentUser.name : 'User';
    } else {
      this.userName = 'User';
    }
  }

  loadHomeData() {
    this.isLoading = true;
    this.hasError = false;

    this.courseService.getHomeData(20).subscribe({
      next: (data) => {
        // Shuffle & limit each section for a fresh random look every visit
        this.trendingCourses = this.shuffleAndLimit(data.trending, this.SECTION_LIMIT);
        this.newestCourses = this.shuffleAndLimit(data.newest, this.SECTION_LIMIT);
        this.categorySections = (data.category_sections || [])
          .map(section => {
            const sorted = [...(section.courses || [])].sort((a, b) => {
              const aStud = a.total_students ?? 0;
              const bStud = b.total_students ?? 0;
              if (bStud !== aStud) {
                return bStud - aStud;
              }
              return b.id - a.id;
            });
            return {
              ...section,
              courses: sorted
            };
          })
          .filter(section => section.courses.length > 0);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load home data', err);
        this.hasError = true;
        this.isLoading = false;
      }
    });

    this.courseService.getCategories().subscribe({
      next: (cats) => { this.categories = cats; },
      error: () => { }
    });
  }

  /** Resolves the thumbnail URL from any possible field the backend might return */
  getThumbnail(course: Course): string | null {
    const raw = course.thumbnail || course.image || course.cover_image
      || course.cover || course.image_url
      || course.thumbnail_path || course.image_path;
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    // relative path — prepend storage base
    return this.storageBaseUrl + raw.replace(/^\//, '');
  }

  /** Resolves the instructor avatar URL */
  getAvatar(avatarPath: string | undefined): string | null {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) return avatarPath;
    return this.storageBaseUrl + avatarPath.replace(/^\//, '');
  }

  formatPrice(price: number): string {
    if (!price || price === 0) return 'Gratis';
    return 'Rp' + price.toLocaleString('id-ID');
  }

  goToCourse(courseId: number) {
    this.router.navigate(['/detail-course', courseId]);
  }

  goToCategorySearch(slug: string) {
    this.router.navigate(['/search'], { queryParams: { category: slug } });
  }

  redirectToLogin() {
    this.router.navigate(['/login']);
  }

  goToCart() {
    this.router.navigate(['/keranjang']);
  }

  /** Fisher-Yates shuffle, returns a randomly ordered copy limited to `limit` items */
  private shuffleAndLimit<T>(arr: T[], limit: number): T[] {
    if (!arr || arr.length === 0) return [];
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, limit);
  }
}

