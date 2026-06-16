import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CourseService, Course } from '../services/course.service';
import { ProgressService } from '../services/progress.service';
import { CertificateService } from '../services/certificate.service';
import { QuizService } from '../services/quiz.service';
import { ProgressSummary } from '../models/index';
import { environment } from '../../environments/environment';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface TransactionHistory {
  id: string;
  invoice: string;
  courseTitle: string;
  price: string;
  date: string;
  status: 'success' | 'pending' | 'cancelled';
  paymentMethod: string;
}

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HistoryPage implements OnInit {
  activeTab: 'transactions' | 'progress' = 'transactions';

  // Transaksi — tetap dummy (endpoint transaksi belum di-expose di API)
  transactions: TransactionHistory[] = [];

  // My Learning dari API getMyLearning()
  myCourses: Course[]           = [];
  progressList: ProgressSummary[] = [];
  isLoadingCourses: boolean     = false;
  isLoadingProgress: boolean    = false;
  hasError: boolean             = false;

  private readonly storageBaseUrl = environment.apiUrl.replace('/api', '/storage/');

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private courseService: CourseService,
    private progressService: ProgressService,
    private certificateService: CertificateService,
    private quizService: QuizService
  ) { }

  ngOnInit() {
    this.loadMyLearning();
  }

  ionViewWillEnter() {
    this.loadMyLearning();
  }

  /** GET /api/my-learning — kursus yang sudah dibeli/enrolled */
  loadMyLearning() {
    this.isLoadingCourses = true;
    this.hasError         = false;

    this.courseService.getMyLearning().subscribe({
      next: (courses) => {
        this.myCourses        = courses;
        this.isLoadingCourses = false;
        // Setelah dapat daftar course, muat progress masing-masing
        this.loadProgress(courses);
      },
      error: (err) => {
        console.error('Gagal memuat my-learning:', err);
        this.isLoadingCourses = false;
        this.hasError         = true;
      }
    });
  }

  /** GET /api/student/progress — semua progress sekaligus (lebih efisien) */
  private loadProgress(courses: Course[]) {
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
                }
              }
            });

            this.progressList      = summaries;
            this.isLoadingProgress = false;
          },
          error: () => {
            this.progressList      = summaries;
            this.isLoadingProgress = false;
          }
        });
      },
      error: () => {
        this.isLoadingProgress = false;
      }
    });
  }

  /** Resolves thumbnail ke full URL */
  getThumbnail(course: Course): string | null {
    const raw = course.thumbnail || (course as any).image;
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return this.storageBaseUrl + raw.replace(/^\//, '');
  }

  goBack() {
    window.history.back();
  }

  setActiveTab(tab: 'transactions' | 'progress') {
    this.activeTab = tab;
  }

  async showInvoiceDetail(tx: TransactionHistory) {
    let statusLabel = '';
    let statusColor = '';

    switch (tx.status) {
      case 'success':
        statusLabel = 'SUKSES';
        statusColor = '#2ecc71';
        break;
      case 'pending':
        statusLabel = 'MENUNGGU PEMBAYARAN';
        statusColor = '#e67e22';
        break;
      case 'cancelled':
        statusLabel = 'DIBATALKAN';
        statusColor = '#e74c3c';
        break;
    }

    const alert = await this.alertController.create({
      header: 'Detail Transaksi',
      subHeader: tx.invoice,
      message: `
        <div style="text-align: left; font-size: 13px; line-height: 1.5; color: #333;">
          <p><strong>Kelas:</strong><br/>${tx.courseTitle}</p>
          <p><strong>Tanggal:</strong><br/>${tx.date}</p>
          <p><strong>Metode Pembayaran:</strong><br/>${tx.paymentMethod}</p>
          <p><strong>Total Bayar:</strong><br/><span style="font-size: 15px; font-weight: 700; color: #852920;">${tx.price}</span></p>
          <p><strong>Status:</strong><br/><span style="color: ${statusColor}; font-weight: 700;">${statusLabel}</span></p>
        </div>
      `,
      buttons: [
        {
          text: 'Tutup',
          role: 'cancel'
        },
        {
          text: tx.status === 'pending' ? 'Bayar Sekarang' : 'Bantuan',
          handler: () => {
            if (tx.status === 'pending') {
              this.showToast('Membuka gerbang pembayaran...');
            } else {
              this.showToast('Menghubungi support...');
            }
          }
        }
      ],
      cssClass: 'invoice-alert'
    });

    await alert.present();
  }

  continueCourse(course: Course) {
    this.router.navigate(['/video-materi'], { queryParams: { course_id: course.id } });
  }

  goToDetail(course: Course) {
    this.router.navigate(['/detail-course', course.id]);
  }

  getProgressForCourse(courseId: number): ProgressSummary | undefined {
    return this.progressList.find(p => p.courseId === courseId || p.course?.id === courseId);
  }

  async claimCertificate(course: Course) {
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

  async showToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1500,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
  }
}
