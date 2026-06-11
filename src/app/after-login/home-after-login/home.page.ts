import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CourseService, Course } from '../../services/course.service';

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
  isLoadingCourses: boolean = false;

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private router: Router
  ) { }

  ngOnInit() {
    this.checkLoginStatus();
    this.loadCourses();
  }

  ionViewWillEnter() {
    this.checkLoginStatus();
    this.loadCourses();
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

  getCourseImageUrl(course: any): string {
    const imagePath = course.thumbnail || course.image || course.cover_image || course.cover || course.image_path || course.thumbnail_path || course.image_url;
    if (!imagePath) {
      return 'https://placehold.co/600x400?text=No+Image'; // URL placeholder default
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `https://a2shi.com/${cleanPath}`;
  }

  redirectToLogin() {
    this.router.navigate(['/login']);
  }

  goToCart() {
    this.router.navigate(['/keranjang']);
  }
}
