import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, ActionSheetController, AlertController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CourseService, Course, Category } from '../../services/course.service';
import { ProgressService } from '../../services/progress.service';
import { CertificateService } from '../../services/certificate.service';
import { QuizService } from '../../services/quiz.service';
import { ProgressSummary } from '../../models/index';
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
  progressList: ProgressSummary[] = [];
  isLoadingProgress: boolean = false;

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private progressService: ProgressService,
    private certificateService: CertificateService,
    private quizService: QuizService,
    private alertController: AlertController,
    private router: Router,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) { }

  ngOnInit() {
    this.checkLoginStatus();
  }

  ionViewWillEnter() {
    // Force refresh saat kembali ke halaman, agar kursus yang baru di-approve langsung muncul
    this.courseService.clearMyLearningCache();
    this.checkLoginStatus();
  }

  handleRefresh(event: any) {
    this.courseService.clearMyLearningCache();
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      const user = this.authService.getCurrentUser();
      this.userRole = 'student';
      this.userName = user?.name ?? 'User';

      this.courseService.getMyLearning(true).subscribe({
        next: (courses) => {
          if (!courses.length) {
            this.enrolledCourses = [];
            this.filteredCourses = [];
            event.target.complete();
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
              
              this.progressService.getMyProgress().subscribe({
                next: (summaries) => {
                  const quizRequests = detailedCourses.map(course =>
                    this.quizService.getStudentQuizzes(course.id).pipe(catchError(() => of([])))
                  );
                  forkJoin(quizRequests).subscribe({
                    next: (allQuizzes) => {
                      summaries.forEach((summary) => {
                        const courseIndex = detailedCourses.findIndex(c => c.id === summary.courseId || c.id === summary.course?.id);
                        if (courseIndex > -1) {
                          const quizzes = allQuizzes[courseIndex] || [];
                          const totalQuizzes = quizzes.length;
                          const completedQuizzes = quizzes.filter(q => q.isAttempted).length;

                          if (totalQuizzes > 0) {
                            const totalItems = summary.totalLessons + totalQuizzes;
                            const completedItems = summary.completedLessons + completedQuizzes;
                            summary.percentage = Math.floor((completedItems / totalItems) * 100);

                            if (completedQuizzes < totalQuizzes) {
                              summary.percentage = Math.min(99, summary.percentage);
                              summary.status = 'in_progress';
                            } else if (summary.completedLessons === summary.totalLessons) {
                              summary.percentage = 100;
                              summary.status = 'completed';
                            }
                          } else {
                            if (summary.totalLessons > 0) {
                              summary.percentage = Math.floor((summary.completedLessons / summary.totalLessons) * 100);
                            } else {
                              summary.percentage = 0;
                            }
                            if (summary.percentage === 100) {
                              summary.status = 'completed';
                            } else {
                              summary.status = 'in_progress';
                            }
                          }
                        }
                      });
                      this.progressList = summaries;
                      
                      this.courseService.getCategories().subscribe({
                        next: (cats) => {
                          this.categories = cats;
                          event.target.complete();
                        },
                        error: () => {
                          event.target.complete();
                        }
                      });
                    },
                    error: () => {
                      this.progressList = summaries;
                      event.target.complete();
                    }
                  });
                },
                error: () => {
                  event.target.complete();
                }
              });
            },
            error: () => {
              this.enrolledCourses = courses;
              this.applyFilter();
              event.target.complete();
            }
          });
        },
        error: () => {
          event.target.complete();
        }
      });
    } else {
      event.target.complete();
    }
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
    // forceRefresh = true agar selalu ambil data terbaru dari API, tidak pakai cache lama
    this.courseService.getMyLearning(true).subscribe({
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
            this.loadProgress(detailedCourses);
          },
          error: () => {
            this.enrolledCourses = courses;
            this.applyFilter();
            this.isLoadingCourses = false;
            this.loadProgress(courses);
          }
        });
      },
      error: () => {
        this.isLoadingCourses = false;
      }
    });
  }

  loadProgress(courses: Course[]) {
    if (!courses.length) return;
    this.isLoadingProgress = true;

    this.progressService.getMyProgress().subscribe({
      next: (summaries) => {
        // Fetch quizzes for each course to check if there are uncompleted quizzes
        const quizRequests = courses.map(course =>
          this.quizService.getStudentQuizzes(course.id).pipe(
            catchError(() => of([]))
          )
        );

        forkJoin(quizRequests).subscribe({
          next: (allQuizzes) => {
            summaries.forEach((summary) => {
              const courseIndex = courses.findIndex(c => c.id === summary.courseId || c.id === summary.course?.id);
              if (courseIndex > -1) {
                const quizzes = allQuizzes[courseIndex] || [];
                const totalQuizzes = quizzes.length;
                const completedQuizzes = quizzes.filter(q => q.isAttempted).length;

                if (totalQuizzes > 0) {
                  // Adjust percentage based on both lessons and quizzes
                  const totalItems = summary.totalLessons + totalQuizzes;
                  const completedItems = summary.completedLessons + completedQuizzes;

                  summary.percentage = Math.floor((completedItems / totalItems) * 100);

                  // If there is any uncompleted quiz, it shouldn't show 100% or completed
                  if (completedQuizzes < totalQuizzes) {
                    summary.percentage = Math.min(99, summary.percentage); // safety cap
                    summary.status = 'in_progress';
                  } else if (summary.completedLessons === summary.totalLessons) {
                    summary.percentage = 100;
                    summary.status = 'completed';
                  }
                } else {
                  // No quizzes, percentage directly based on lessons
                  if (summary.totalLessons > 0) {
                    summary.percentage = Math.floor((summary.completedLessons / summary.totalLessons) * 100);
                  } else {
                    summary.percentage = 0;
                  }
                  if (summary.percentage === 100) {
                    summary.status = 'completed';
                  } else {
                    summary.status = 'in_progress';
                  }
                }
              }
            });

            this.progressList = summaries;
            this.isLoadingProgress = false;
          },
          error: () => {
            this.progressList = summaries;
            this.isLoadingProgress = false;
          }
        });
      },
      error: () => {
        this.isLoadingProgress = false;
      }
    });
  }

  getProgressForCourse(courseId: number): ProgressSummary | undefined {
    return this.progressList.find(p => p.courseId === courseId || p.course?.id === courseId);
  }

  async claimCertificate(event: Event, course: Course) {
    event.stopPropagation(); // Prevent course card navigation click!
    const alert = await this.alertController.create({
      header: 'Selamat!',
      subHeader: 'Klaim Sertifikat Anda',
      message: `Selamat Anda telah menyelesaikan kelas <strong>${course.title}</strong>. Sertifikat kelulusan digital Anda telah diterbitkan secara otomatis!`,
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Unduh PDF',
          handler: () => {
            this.showToast('Mencari sertifikat...');
            this.certificateService.getMyCertificates().subscribe({
              next: (certs) => {
                const cert = certs.find((c: any) => c.course?.id === course.id);
                if (cert) {
                  this.showToast('Membuka sertifikat...');
                  const downloadUrl = this.certificateService.getDownloadUrl(cert.id);
                  window.open(downloadUrl, '_system');
                } else {
                  this.showToast('Sertifikat belum tersedia untuk kelas ini.');
                }
              },
              error: () => {
                this.showToast('Gagal memuat sertifikat.');
              }
            });
          }
        }
      ]
    });

    await alert.present();
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