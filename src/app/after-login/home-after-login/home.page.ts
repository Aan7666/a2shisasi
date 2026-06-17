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
  courses: Course[] = [];
  categories: Category[] = [];
  selectedCategory: Category | null = null;
  categoryCourses: Course[] = [];
  isLoadingCourses: boolean = false;
  isLoadingCategoryCourses: boolean = false;

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private router: Router
  ) { }

  ngOnInit() {
    this.checkLoginStatus();
    this.loadCourses();
    this.loadCategories();
  }

  ionViewWillEnter() {
    this.checkLoginStatus();
    this.loadCourses();
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

  loadCourses() {
    this.isLoadingCourses = true;
    this.courseService.getCourses().subscribe({
      next: (data) => {
        this.courses = data;
        this.isLoadingCourses = false;
      },
      error: (err) => {
        console.error('Gagal mengambil daftar course:', err);
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
}
