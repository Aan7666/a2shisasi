import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CourseService, Course } from '../services/course.service';
import { ProgressService } from '../services/progress.service';
import { CertificateService } from '../services/certificate.service';
import { QuizService } from '../services/quiz.service';
import { TransactionService, Transaction, TransactionStatus } from '../services/transaction.service';
import { ProgressSummary } from '../models/index';
import { environment } from '../../environments/environment';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HistoryPage implements OnInit {
  activeTab: 'transactions' | 'progress' = 'transactions';

  // ── Transactions ─────────────────────────────────────────
  transactions: Transaction[] = [];
  isLoadingTx: boolean = false;
  txError: boolean = false;

  // Upload proof state
  uploadingTxId: number | null = null;

  // Invoice modal state
  isInvoiceModalOpen: boolean = false;
  selectedTx: Transaction | null = null;

  // Payment method modal state
  isPaymentModalOpen: boolean = false;
  paymentModalTx: Transaction | null = null;
  selectedPaymentMethod: string = 'bank_transfer';
  selectedProofFile: File | null = null;
  proofPreviewUrl: string | null = null;
  isUploadingProof: boolean = false;

  paymentMethods = [
    { id: 'bank_transfer', label: 'Bank Transfer', icon: 'business-outline', detail: '901268770803\nAan Ripandi' },
    { id: 'gopay', label: 'GoPay', icon: 'phone-portrait-outline', detail: '0857-XXXX-XXXX (GoPay)' },
    { id: 'ovo', label: 'OVO', icon: 'wallet-outline', detail: '0857-XXXX-XXXX (OVO)' },
    { id: 'dana', label: 'Dana', icon: 'card-outline', detail: '0857-XXXX-XXXX (Dana)' },
  ];

  // ── My Learning ──────────────────────────────────────────
  myCourses: Course[] = [];
  progressList: ProgressSummary[] = [];
  isLoadingCourses: boolean = false;
  isLoadingProgress: boolean = false;
  hasError: boolean = false;

  private readonly storageBaseUrl = environment.apiUrl.replace('/api', '/storage/');

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private courseService: CourseService,
    private progressService: ProgressService,
    private certificateService: CertificateService,
    private quizService: QuizService,
    private transactionService: TransactionService
  ) { }

  ngOnInit() {
    this.loadMyLearning();
    this.loadTransactions();
  }

  ionViewWillEnter() {
    // Clear cache agar kursus yang baru di-approve langsung muncul
    this.courseService.clearMyLearningCache();
    this.loadMyLearning();
    this.loadTransactions();
  }

  handleRefresh(event: any) {
    this.courseService.clearMyLearningCache();
    const tx$ = this.transactionService.getTransactions().pipe(catchError(() => of([])));
    const learn$ = this.courseService.getMyLearning(true).pipe(catchError(() => of([])));
    forkJoin([tx$, learn$]).subscribe({
      next: ([txs, courses]) => {
        this.transactions = txs;
        this.myCourses = courses;
        if (courses.length > 0) {
          this.progressService.getMyProgress().subscribe({
            next: (summaries) => {
              const quizRequests = courses.map(course =>
                this.quizService.getStudentQuizzes(course.id).pipe(catchError(() => of([])))
              );
              forkJoin(quizRequests).subscribe({
                next: (allQuizzes) => {
                  summaries.forEach((summary) => {
                    const courseIndex = courses.findIndex(c => c.id === summary.courseId || c.id === summary.course?.id);
                    if (courseIndex > -1) {
                      const quizzes = allQuizzes[courseIndex] || [];
                      const totalQuizzes = quizzes.length;
                      const completedQuizzes = quizzes.filter((q: any) => q.isAttempted).length;
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
                  event.target.complete();
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
        } else {
          event.target.complete();
        }
      },
      error: () => {
        event.target.complete();
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  // TRANSACTIONS
  // ═══════════════════════════════════════════════════════

  /** GET /api/student/transactions */
  loadTransactions() {
    this.isLoadingTx = true;
    this.txError = false;

    this.transactionService.getTransactions().subscribe({
      next: (data) => {
        this.transactions = data;
        this.isLoadingTx = false;
      },
      error: (err) => {
        console.error('Gagal memuat transaksi:', err);
        this.isLoadingTx = false;
        this.txError = true;
      }
    });
  }

  /** Membuka payment method modal */
  openProofUpload(tx: Transaction) {
    this.paymentModalTx = tx;
    this.selectedPaymentMethod = 'bank_bsi';
    this.selectedProofFile = null;
    this.proofPreviewUrl = null;
    this.isPaymentModalOpen = true;
    this.isInvoiceModalOpen = false;
  }

  /** Pilih file bukti dari device */
  triggerFileInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpg,image/jpeg,image/png';
    input.onchange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('Ukuran file maksimal 5 MB.', 'warning');
        return;
      }
      this.selectedProofFile = file;
      const reader = new FileReader();
      reader.onload = (e) => { this.proofPreviewUrl = e.target?.result as string; };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  /** Submit upload dari payment modal */
  async submitProofUpload() {
    if (!this.paymentModalTx || !this.selectedProofFile) {
      await this.showToast('Silakan pilih file bukti terlebih dahulu.', 'warning');
      return;
    }
    await this.doUploadProof(this.paymentModalTx, this.selectedProofFile);
    this.isPaymentModalOpen = false;
    this.paymentModalTx = null;
    this.selectedProofFile = null;
    this.proofPreviewUrl = null;
  }

  getSelectedPaymentMethod() {
    return this.paymentMethods.find(m => m.id === this.selectedPaymentMethod);
  }

  private async doUploadProof(tx: Transaction, file: File) {
    const loading = await this.loadingController.create({
      message: 'Mengupload bukti transfer...',
      spinner: 'crescent'
    });
    await loading.present();

    this.uploadingTxId = tx.id;

    this.transactionService.uploadProof(tx.id, file, this.selectedPaymentMethod).subscribe({
      next: async (result) => {
        await loading.dismiss();
        this.uploadingTxId = null;

        // Update status lokal agar UI langsung berubah
        const idx = this.transactions.findIndex(t => t.id === tx.id);
        if (idx > -1) {
          this.transactions[idx].status = result.status;
          this.transactions[idx].proof_image = result.proofImage;
        }

        await this.showToast(
          'Bukti transfer berhasil diupload. Menunggu konfirmasi admin.',
          'success'
        );
      },
      error: async (err) => {
        await loading.dismiss();
        this.uploadingTxId = null;
        await this.showToast(err.message || 'Gagal mengupload bukti.', 'danger');
      }
    });
  }

  /** Tampilkan detail transaksi dalam modal */
  showInvoiceDetail(tx: Transaction) {
    this.selectedTx = tx;
    this.isInvoiceModalOpen = true;
  }

  /** Resolve URL gambar bukti dari path relatif storage */
  resolveProofImage(tx: Transaction): string | null {
    return this.transactionService.resolveProofUrl(tx.proof_image);
  }

  // ── UI helpers ───────────────────────────────────────────

  /** Label status bahasa Indonesia */
  statusLabel(status: TransactionStatus): string {
    const map: Record<TransactionStatus, string> = {
      PAID: 'Lunas',
      PENDING: 'Pending',
      CANCELLED: 'Batal',
      FAILED: 'Gagal',
    };
    return map[status] ?? status;
  }

  /** CSS class untuk badge status */
  statusClass(status: TransactionStatus): string {
    const map: Record<TransactionStatus, string> = {
      PAID: 'paid',
      PENDING: 'pending',
      CANCELLED: 'cancelled',
      FAILED: 'cancelled',
    };
    return map[status] ?? 'pending';
  }

  formatPrice(tx: Transaction): string {
    const amount = tx.amount ?? tx.price ?? tx.course?.price ?? 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  resolveCourseThumbnail(tx: Transaction): string | null {
    const raw = tx.course?.thumbnail;
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return this.storageBaseUrl + raw.replace(/^\//, '');
  }

  // ═══════════════════════════════════════════════════════
  // MY LEARNING / PROGRESS
  // ═══════════════════════════════════════════════════════

  /** GET /api/my-learning — kursus yang sudah dibeli/enrolled */
  loadMyLearning() {
    this.isLoadingCourses = true;
    this.hasError = false;

    // forceRefresh = true agar selalu ambil data terbaru dari server
    this.courseService.getMyLearning(true).subscribe({
      next: (courses) => {
        this.myCourses = courses;
        this.isLoadingCourses = false;
        this.loadProgress(courses);
      },
      error: (err) => {
        console.error('Gagal memuat my-learning:', err);
        this.isLoadingCourses = false;
        this.hasError = true;
      }
    });
  }

  /** GET /api/student/progress — semua progress sekaligus */
  private loadProgress(courses: Course[]) {
    if (!courses.length) return;
    this.isLoadingProgress = true;

    this.progressService.getMyProgress().subscribe({
      next: (summaries) => {
        const quizRequests = courses.map(course =>
          this.quizService.getStudentQuizzes(course.id).pipe(catchError(() => of([])))
        );

        forkJoin(quizRequests).subscribe({
          next: (allQuizzes) => {
            summaries.forEach((summary) => {
              const courseIndex = courses.findIndex(c => c.id === summary.courseId || c.id === summary.course?.id);
              if (courseIndex > -1) {
                const quizzes = allQuizzes[courseIndex] || [];
                const totalQuizzes = quizzes.length;
                const completedQuizzes = quizzes.filter((q: any) => q.isAttempted).length;

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

  getThumbnail(course: Course): string | null {
    const raw = course.thumbnail || (course as any).image;
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return this.storageBaseUrl + raw.replace(/^\//, '');
  }

  goBack() { window.history.back(); }

  setActiveTab(tab: 'transactions' | 'progress') { this.activeTab = tab; }

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
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Unduh PDF',
          handler: () => {
            this.showToast('Mencari sertifikat...', 'dark');
            this.certificateService.getMyCertificates().subscribe({
              next: (certs) => {
                const cert = certs.find((c: any) => c.course?.id === course.id);
                if (cert) {
                  this.showToast('Membuka sertifikat...', 'dark');
                  const downloadUrl = this.certificateService.getDownloadUrl(cert.id);
                  window.open(downloadUrl, '_system');
                } else {
                  this.showToast('Sertifikat belum tersedia untuk kelas ini.', 'warning');
                }
              },
              error: () => this.showToast('Gagal memuat sertifikat.', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async showToast(msg: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}
