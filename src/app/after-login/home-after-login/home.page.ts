import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CourseService, Course, Category } from '../../services/course.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  isLoggedIn: boolean = false;
  userName: string = 'User';

  // Raw from API
  private allCourses: Course[] = [];

  // Displayed (random, limited)
  trendingCourses: Course[] = [];
  suggestedCourses: Course[] = [];

  categories: Category[] = [];
  selectedCategory: Category | null = null;
  categoryCourses: Course[] = [];
  categorySections: { category: Category; courses: Course[] }[] = [];
  isLoadingCourses: boolean = false;
  isLoadingCategoryCourses: boolean = false;

  /** Max courses shown per section */
  private readonly SECTION_LIMIT = 6;

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private router: Router
  ) { }

  ngOnInit() {
    this.checkLoginStatus();
    this.loadHomeData();
    this.loadCategories();
  }

  ionViewWillEnter() {
    this.checkLoginStatus();
    this.loadHomeData();
    this.loadCategories();
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
    this.isLoadingCourses = true;
    this.courseService.getHomeData(50).subscribe({
      next: (data) => {
        // Shuffle & limit each section for a fresh random look every visit
        this.trendingCourses = this.shuffleAndLimit(data.trending || [], this.SECTION_LIMIT);
        this.suggestedCourses = this.shuffleAndLimit(data.newest || [], this.SECTION_LIMIT);
        
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
              category: {
                id: section.category_id,
                name: section.category_name,
                slug: section.category_slug
              },
              courses: sorted
            };
          })
          .filter(section => section.courses.length > 0);
        this.isLoadingCourses = false;
      },
      error: (err) => {
        console.error('Gagal memuat data home:', err);
        this.isLoadingCourses = false;
      }
    });
  }

  loadCategories() {
    this.courseService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
      },
      error: (err) => {
        console.error('Gagal mengambil daftar kategori:', err);
      }
    });
  }

  goToCategorySearch(slug: string) {
    const cat = this.categories.find(c => c.slug === slug);
    if (cat) {
      this.selectedCategory = cat;
      this.isLoadingCategoryCourses = true;
      this.categoryCourses = [];

      this.courseService.searchCourses({ category_id: cat.id }).subscribe({
        next: (data) => {
          this.categoryCourses = data;
          this.isLoadingCategoryCourses = false;
          
          setTimeout(() => {
            const el = document.getElementById('category-pills-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        },
        error: (err) => {
          console.error('Gagal mengambil course kategori:', err);
          this.isLoadingCategoryCourses = false;
        }
      });
    }
  }

  toggleCategory(cat: Category) {
    if (this.selectedCategory && this.selectedCategory.id === cat.id) {
      // Deselect if clicked again
      this.selectedCategory = null;
      this.categoryCourses = [];
    } else {
      // Select category and fetch courses
      this.selectedCategory = cat;
      this.isLoadingCategoryCourses = true;
      this.categoryCourses = [];

      this.courseService.searchCourses({ category_id: cat.id }).subscribe({
        next: (data) => {
          this.categoryCourses = data;
          this.isLoadingCategoryCourses = false;
        },
        error: (err) => {
          console.error('Gagal mengambil course kategori:', err);
          this.isLoadingCategoryCourses = false;
        }
      });
    }
  }

  getCourseImageUrl(course: any): string {
    const imagePath = course.thumbnail || course.image || course.cover_image || course.cover || course.image_path || course.thumbnail_path || course.image_url;
    if (!imagePath) {
      return 'https://placehold.co/600x400?text=No+Image'; // URL placeholder default
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `${environment.apiUrl.replace('/api', '/storage/')}${cleanPath}`;
  }

  redirectToLogin() {
    this.router.navigate(['/login']);
  }

  goToCart() {
    this.router.navigate(['/keranjang']);
  }

  goToCourse(id: number) {
    this.router.navigate(['/detail-course', id]);
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
