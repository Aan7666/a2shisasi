import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CourseService, Course } from '../../services/course.service';
import { InstructorService, InstructorDashboard } from '../../services/instructor.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.page.html',
  styleUrls: ['./courses.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, RouterModule]
})
export class CoursesPage implements OnInit {

  isLoggedIn: boolean = false;
  userRole: string = 'student';   // 'student' | 'instructor'
  userName: string = 'User';

  // ── Student state ──────────────────────────────────────────
  enrolledCourses: Course[] = [];
  isLoadingCourses: boolean = false;

  // ── Instructor state ───────────────────────────────────────
  dashboard: InstructorDashboard | null = null;
  instructorCourses: Course[] = [];
  isLoadingDashboard: boolean = false;
  isLoadingInstructorCourses: boolean = false;

  // ── Create/Edit modal ──────────────────────────────────────
  showCourseModal: boolean = false;
  editingCourse: Course | null = null;
  courseForm!: FormGroup;
  isSaving: boolean = false;

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private instructorService: InstructorService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.initForm();
    this.checkLoginStatus();
  }

  ionViewWillEnter() {
    this.checkLoginStatus();
  }

  initForm() {
    this.courseForm = this.fb.group({
      title:       ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', Validators.required],
      price:       [0, [Validators.required, Validators.min(0)]],
      thumbnail:   [''],
      status:      ['draft']
    });
  }

  checkLoginStatus() {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      const user = this.authService.getCurrentUser();
      this.userRole = user?.role ?? 'student';
      this.userName = user?.name ?? 'User';

      if (this.userRole === 'instructor') {
        this.loadInstructorData();
      } else {
        this.loadEnrolledCourses();
      }
    }
  }

  // ── STUDENT: load enrolled courses ────────────────────────
  loadEnrolledCourses() {
    this.isLoadingCourses = true;
    this.courseService.getCourses().subscribe({
      next: (data) => {
        this.enrolledCourses = data;
        this.isLoadingCourses = false;
      },
      error: () => { this.isLoadingCourses = false; }
    });
  }

  getCourseImage(course: Course): string {
    const p = course.thumbnail || course.image || course.cover_image
           || course.cover || course.image_path || course.thumbnail_path
           || course.image_url;
    if (!p) return 'https://placehold.co/600x400?text=No+Image';
    if (p.startsWith('http')) return p;
    return `${environment.apiUrl.replace('/api', '/storage/')}${p.startsWith('/') ? p.substring(1) : p}`;
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

  // ── INSTRUCTOR: dashboard + courses ───────────────────────
  loadInstructorData() {
    this.loadDashboard();
    this.loadInstructorCourses();
  }

  loadDashboard() {
    this.isLoadingDashboard = true;
    this.instructorService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.isLoadingDashboard = false;
      },
      error: () => { this.isLoadingDashboard = false; }
    });
  }

  loadInstructorCourses() {
    this.isLoadingInstructorCourses = true;
    this.instructorService.getCourses().subscribe({
      next: (data) => {
        this.instructorCourses = data;
        this.isLoadingInstructorCourses = false;
      },
      error: () => { this.isLoadingInstructorCourses = false; }
    });
  }

  // ── Create Course ─────────────────────────────────────────
  openCreateModal() {
    this.editingCourse = null;
    this.courseForm.reset({ status: 'draft', price: 0 });
    this.showCourseModal = true;
  }

  // ── Edit Course ───────────────────────────────────────────
  openEditModal(course: Course) {
    this.editingCourse = course;
    this.courseForm.patchValue({
      title:       course.title,
      description: course.description ?? '',
      price:       course.price,
      thumbnail:   course.thumbnail ?? '',
      status:      course.status
    });
    this.showCourseModal = true;
  }

  closeModal() {
    this.showCourseModal = false;
    this.editingCourse = null;
    this.courseForm.reset({ status: 'draft', price: 0 });
  }

  saveCourse() {
    if (this.courseForm.invalid) return;
    this.isSaving = true;
    const payload = this.courseForm.value;

    const obs = this.editingCourse
      ? this.instructorService.updateCourse(this.editingCourse.id, payload)
      : this.instructorService.createCourse(payload);

    obs.subscribe({
      next: () => {
        this.isSaving = false;
        this.closeModal();
        this.loadInstructorCourses();
        this.loadDashboard();
        this.showToast(this.editingCourse ? 'Course berhasil diupdate' : 'Course berhasil dibuat!');
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err?.error?.message ?? 'Gagal menyimpan course';
        this.showToast(msg);
      }
    });
  }

  // ── Delete Course ─────────────────────────────────────────
  async confirmDelete(course: Course) {
    const alert = await this.alertController.create({
      header: 'Hapus Course',
      message: `Hapus "${course.title}"? Tindakan ini tidak bisa dibatalkan.`,
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: () => this.deleteCourse(course.id)
        }
      ]
    });
    await alert.present();
  }

  deleteCourse(id: number) {
    this.instructorService.deleteCourse(id).subscribe({
      next: () => {
        this.instructorCourses = this.instructorCourses.filter(c => c.id !== id);
        this.loadDashboard();
        this.showToast('Course berhasil dihapus');
      },
      error: () => this.showToast('Gagal menghapus course')
    });
  }

  getStatusColor(status: string): string {
    return status === 'published' ? 'success' : status === 'archived' ? 'medium' : 'warning';
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