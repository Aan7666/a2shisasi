import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { CourseService, CourseDetail } from '../services/course.service';
import { TransactionService, Transaction } from '../services/transaction.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CheckoutPage implements OnInit, OnDestroy {
  // Current screen step: 1 = Checkout Selection, 2 = Waiting for Payment, 3 = Payment Success
  currentStep: number = 1;

  // Selected Payment Method: 'ewallet' | 'card' | 'bank'
  selectedMethod: string = 'ewallet';

  // State
  isInstructionsOpen: boolean = false;
  countdownText: string = '23:59:45';
  private timerInterval: any;

  // Dynamic details
  courseId: number | null = null;
  course: CourseDetail | null = null;
  transaction: Transaction | null = null;
  isLoading: boolean = false;
  isPlacingOrder: boolean = false;
  isUploadingProof: boolean = false;

  orderId: string = '#EDU-992384';
  orderDate: string = '20 Mei 2024';

  private readonly storageBaseUrl = environment.apiUrl.replace('/api', '/storage/');

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private courseService: CourseService,
    private transactionService: TransactionService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const cId = Number(params['course_id']);
      if (cId) {
        this.courseId = cId;
        this.loadCourse(cId);
      }
    });
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  loadCourse(id: number) {
    this.isLoading = true;
    this.courseService.getCourseDetail(id).subscribe({
      next: (course) => {
        this.course = course;
        this.isLoading = false;
      },
      error: async (err) => {
        console.error('Gagal memuat detail kelas untuk checkout:', err);
        this.isLoading = false;
        const toast = await this.toastController.create({
          message: 'Gagal memuat detail kelas: ' + err.message,
          duration: 3000,
          position: 'bottom',
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  getThumbnail(): string | null {
    if (!this.course) return null;
    const raw = this.course.thumbnail || this.course.image || this.course.cover_image;
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return this.storageBaseUrl + raw.replace(/^\//, '');
  }

  formatPrice(price: number | undefined): string {
    if (price === undefined || price === null) return 'Rp0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(price);
  }

  getTransactionAmountString(): string {
    const amount = this.transaction?.amount ?? this.transaction?.price ?? this.course?.price ?? 0;
    return amount.toString();
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  goBack() {
    if (this.currentStep > 1 && this.currentStep < 3) {
      this.currentStep = 1;
      this.stopTimer();
    } else {
      window.history.back();
    }
  }

  selectMethod(method: string) {
    this.selectedMethod = method;
  }

  toggleInstructions() {
    this.isInstructionsOpen = !this.isInstructionsOpen;
  }

  async placeOrder() {
    if (!this.courseId) {
      const toast = await this.toastController.create({
        message: 'Kelas tidak valid atau belum dimuat.',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Membuat pesanan...',
      spinner: 'crescent'
    });
    await loading.present();
    this.isPlacingOrder = true;

    this.transactionService.createTransaction(this.courseId).subscribe({
      next: async (tx) => {
        await loading.dismiss();
        this.isPlacingOrder = false;
        this.transaction = tx;
        this.orderId = tx.invoice_number ?? `#TRX-${tx.id}`;
        this.orderDate = tx.created_at 
          ? new Date(tx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
          : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        
        this.currentStep = 2;
        this.startTimer();
      },
      error: async (err) => {
        await loading.dismiss();
        this.isPlacingOrder = false;
        const toast = await this.toastController.create({
          message: 'Gagal membuat pesanan: ' + (err.message || 'Error server'),
          duration: 3000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    });
  }

  async openProofUpload() {
    if (!this.transaction) {
      const toast = await this.toastController.create({
        message: 'Belum ada transaksi aktif.',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpg,image/jpeg,image/png';
    input.onchange = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        const toast = await this.toastController.create({
          message: 'Ukuran file maksimal 5 MB.',
          duration: 2000,
          color: 'warning'
        });
        await toast.present();
        return;
      }
      this.doUploadProof(file);
    };
    input.click();
  }

  private async doUploadProof(file: File) {
    if (!this.transaction) return;
    const loading = await this.loadingController.create({
      message: 'Mengunggah bukti transfer...',
      spinner: 'crescent'
    });
    await loading.present();
    this.isUploadingProof = true;

    this.transactionService.uploadProof(this.transaction.id, file).subscribe({
      next: async (result) => {
        await loading.dismiss();
        this.isUploadingProof = false;
        if (this.transaction) {
          this.transaction.status = result.status;
          this.transaction.proof_image = result.proofImage;
        }
        const toast = await this.toastController.create({
          message: 'Bukti transfer berhasil diunggah. Menunggu konfirmasi admin.',
          duration: 3000,
          color: 'success'
        });
        await toast.present();
      },
      error: async (err) => {
        await loading.dismiss();
        this.isUploadingProof = false;
        const toast = await this.toastController.create({
          message: err.message || 'Gagal mengunggah bukti.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  async checkOrderStatus() {
    if (!this.transaction) {
      this.currentStep = 3; // Fallback
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Memeriksa status pembayaran...',
      spinner: 'crescent'
    });
    await loading.present();

    this.transactionService.getTransaction(this.transaction.id).subscribe({
      next: async (tx) => {
        await loading.dismiss();
        this.transaction = tx;
        if (tx.status === 'PAID') {
          this.currentStep = 3;
          this.stopTimer();
          const toast = await this.toastController.create({
            message: 'Pembayaran sukses diverifikasi!',
            duration: 2000,
            color: 'success'
          });
          await toast.present();
        } else {
          const toast = await this.toastController.create({
            message: 'Pembayaran Anda masih pending. Silakan lakukan transfer dan upload bukti pembayaran di halaman History.',
            duration: 4000,
            color: 'warning',
            position: 'bottom'
          });
          await toast.present();
        }
      },
      error: async (err) => {
        await loading.dismiss();
        const toast = await this.toastController.create({
          message: 'Gagal memverifikasi status: ' + err.message,
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  viewCourses() {
    this.router.navigate(['/tabs-after-login/courses']);
  }

  startLearning() {
    this.router.navigate(['/tabs-after-login/courses']);
  }

  goToMyCourses() {
    this.router.navigate(['/history'], { queryParams: { tab: 'progress' } });
  }

  closeCheckout() {
    this.router.navigate(['/tabs-after-login/home']);
  }

  async copyText(text: string, type: string) {
    navigator.clipboard.writeText(text).then(async () => {
      const toast = await this.toastController.create({
        message: `${type} copied to clipboard!`,
        duration: 1000,
        position: 'bottom',
        color: 'dark'
      });
      await toast.present();
    }).catch(async () => {
      const toast = await this.toastController.create({
        message: 'Failed to copy',
        duration: 1000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
    });
  }

  // Timer helpers
  private startTimer() {
    let totalSeconds = 24 * 60 * 60 - 15; // 23 hours, 59 minutes, 45 seconds
    this.stopTimer();
    
    this.timerInterval = setInterval(() => {
      if (totalSeconds <= 0) {
        this.stopTimer();
        return;
      }
      totalSeconds--;
      
      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;
      
      this.countdownText = `${this.pad(hrs)}:${this.pad(mins)}:${this.pad(secs)}`;
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private pad(val: number): string {
    return val < 10 ? '0' + val : '' + val;
  }
}
