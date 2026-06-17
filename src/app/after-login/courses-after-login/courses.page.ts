import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, ActionSheetController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CourseService, Course, Category } from '../../services/course.service';
import { environment } from '../../../environments/environment';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.page.html',
  styleUrls: ['./courses.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class CoursesPage implements OnInit {

  isLoggedIn: boolean = false;
  userRole: string = 'student';
  userName: string = 'User';

  enrolledCourses: Course[] = [];
  filteredCourses: Course[] = [];
  categories: Category[] = [];
  selectedCategoryId: number | null = null;
  isLoadingCourses: boolean = false;
  isSearchBarOpen: boolean = false;
  searchQuery: string = '';

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private router: Router,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {
    this.checkLoginStatus();
  }

  ionViewWillEnter() {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      const user = this.authService.getCurrentUser();
      this.userRole = 'student'; // Force student role to show student view for all roles
      this.userName = user?.name ?? 'User';

      this.loadEnrolledCourses();
      this.loadCategories();
    }
  }

  loadEnrolledCourses() {
    this.isLoadingCourses = true;
    this.courseService.getMyLearning().subscribe({
      next: (courses) => {
        if (!courses.length) {
          this.enrolledCourses = [];
          this.filteredCourses = [];
          this.isLoadingCourses = false;
          return;
        }

        const detailRequests = courses.map(course =>
          this.courseService.getCourseDetail(course.id).pipe(
            catchError(() => of(course))
          )
        );

        forkJoin(detailRequests).subscribe({
          next: (detailedCourses) => {
            this.enrolledCourses = detailedCourses;
            this.applyFilter();
            this.isLoadingCourses = false;
          },
          error: () => {
            this.enrolledCourses = courses;
            this.applyFilter();
            this.isLoadingCourses = false;
          }
        });
      },
      error: () => { 
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
        console.error('Gagal memuat kategori', err);
      }
    });
  }

  toggleSearchBar() {
    this.isSearchBarOpen = !this.isSearchBarOpen;
    if (!this.isSearchBarOpen) {
      this.searchQuery = '';
      this.applyFilter();
    }
  }

  applyFilter() {
    let temp = this.enrolledCourses;

    if (this.selectedCategoryId !== null) {
      temp = temp.filter(course => 
        course.category && course.category.id === this.selectedCategoryId
      );
    }

    const query = this.searchQuery.toLowerCase().trim();
    if (query) {
      temp = temp.filter(course =>
        course.title.toLowerCase().includes(query) ||
        (course.instructor?.name && course.instructor.name.toLowerCase().includes(query))
      );
    }

    this.filteredCourses = temp;
  }

  async openFilterOptions() {
    const buttons: any[] = this.categories.map(cat => ({
      text: cat.name,
      handler: () => {
        this.selectedCategoryId = cat.id;
        this.applyFilter();
        this.showToast(`Memfilter berdasarkan: ${cat.name}`);
      }
    }));

    buttons.unshift({
      text: 'Semua Kategori',
      icon: 'list-outline',
      handler: () => {
        this.selectedCategoryId = null;
        this.applyFilter();
        this.showToast('Menampilkan semua kelas');
      }
    });

    buttons.push({
      text: 'Batal',
      role: 'cancel',
      icon: 'close-outline'
    });

    const actionSheet = await this.actionSheetController.create({
      header: 'Filter Kategori',
      buttons: buttons
    });
    await actionSheet.present();
  }

  getCourseImage(course: Course): string {
    const p = course.thumbnail || course.image || course.cover_image
           || course.cover || course.image_path || course.thumbnail_path
           || course.image_url;
    if (!p) return 'https://placehold.co/600x400?text=No+Image';
    if (p.startsWith('http')) return p;
    return `${environment.apiUrl.replace('/api', '/storage/')}${p.startsWith('/') ? p.substring(1) : p}`;
  }

  getInstructorAvatar(course: Course): string {
    const avatar = course.instructor?.avatar;
    if (!avatar) return 'assets/default-avatar.png';
    if (avatar.startsWith('http')) return avatar;
    return `${environment.apiUrl.replace('/api', '/storage/')}${avatar.startsWith('/') ? avatar.substring(1) : avatar}`;
  }

  goToCourse(id: number) {
    this.router.navigate(['/detail-course', id]);
  }

  goToSearch() {
    this.router.navigate(['/tabs-after-login/search']);
  }

  redirectToLogin() {
    this.router.navigate(['/login']);
  }

  async showToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2500,
      color: 'dark',
      position: 'bottom'
    });
    await toast.present();
  }
}