import { Component, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReviewService, Review } from '../services/review.service';
import { CourseService, CourseDetail } from '../services/course.service';
import { EnrollmentService } from '../services/enrollment.service';
import { QuizService } from '../services/quiz.service';
import { TransactionService } from '../services/transaction.service';
import { Quiz } from '../models/index';
import { environment } from '../../environments/environment';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  peopleOutline,
  star,
  bookOutline,
  heart,
  heartOutline,
  cartOutline,
  playCircleOutline,
  chevronUpOutline,
  chevronDownOutline,
  documentTextOutline,
  checkmarkCircle,
  videocamOutline,
  playCircle,
  lockClosedOutline,
  helpCircleOutline,
  timeOutline,
  cart,
  alertCircleOutline,
  copyOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-detail-course',
  templateUrl: './detail-course.page.html',
  styleUrls: ['./detail-course.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, TitleCasePipe]
})
export class DetailCoursePage implements OnInit {
  activeTab: 'description' | 'curriculum' | 'instructor' | 'reviews' = 'description';
  isDescriptionExpanded: boolean = false;
  isInstructorExpanded: boolean = false;

  // Wishlist / Cart state (UI-only for now)
  isWishlisted: boolean = false;
  isAddedToCart: boolean = false;

  // Payment modal
  showPaymentModal: boolean = false;

  // API data
  course: CourseDetail | null = null;
  isLoading: boolean = true;
  hasError: boolean = false;
  // Review related state
  reviews: Review[] = [];
  myReview: Review | null = null;
  loadingReviews: boolean = false;
  submittingReview: boolean = false;
  myReviewRating: number | null = null;
  myReviewComment: string = '';
  errorMessage: string = '';
  courseId: number = 0;
  quizzes: Quiz[] = [];
  isLoadingQuizzes: boolean = false;

  private readonly storageBaseUrl = environment.apiUrl.replace('/api', '/storage/');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private toastController: ToastController,
    private enrollmentService: EnrollmentService,
    private quizService: QuizService,
    private loadingController: LoadingController,
    private transactionService: TransactionService,
    private alertController: AlertController,
    private reviewService: ReviewService
  ) {
    addIcons({
      'chevron-back-outline': chevronBackOutline,
      'people-outline': peopleOutline,
      'star': star,
      'book-outline': bookOutline,
      'heart': heart,
      'heart-outline': heartOutline,
      'cart-outline': cartOutline,
      'play-circle-outline': playCircleOutline,
      'chevron-up-outline': chevronUpOutline,
      'chevron-down-outline': chevronDownOutline,
      'document-text-outline': documentTextOutline,
      'checkmark-circle': checkmarkCircle,
      'videocam-outline': videocamOutline,
      'play-circle': playCircle,
      'lock-closed-outline': lockClosedOutline,
      'help-circle-outline': helpCircleOutline,
      'time-outline': timeOutline,
      'cart': cart,
      'alert-circle-outline': alertCircleOutline,
      'copy-outline': copyOutline
    });
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.courseId = id;
      this.loadCourse(id);
    } else {
      this.hasError = true;
      this.isLoading = false;
    }
  }

  ionViewWillEnter() {
    if (this.courseId && this.course) {
      if (this.course.has_access) {
        this.loadQuizzes(this.courseId);
        this.loadLessonsProgress(this.courseId);
      }
    }
  }

  handleRefresh(event: any) {
    if (!this.courseId) {
      event.target.complete();
      return;
    }
    this.courseService.getCourseDetail(this.courseId).subscribe({
      next: (data) => {
        this.course = data;
        this.loadReviews();
        this.loadMyReview();
        if (this.course?.has_access) {
          this.loadQuizzes(this.courseId);
          this.loadLessonsProgress(this.courseId);
        }
        event.target.complete();
      },
      error: (err) => {
        console.error('Refresh failed:', err);
        event.target.complete();
      }
    });
  }

  loadCourse(id: number) {
    this.isLoading = true;
    this.hasError = false;

    this.courseService.getCourseDetail(id).subscribe({
      next: (data) => {
        this.course = data;
        // After course data loaded, fetch reviews
        this.loadReviews();
        this.loadMyReview();
        this.isLoading = false;

        const saved = localStorage.getItem('wishlist_items');
        if (saved) {
          const items = JSON.parse(saved);
          this.isWishlisted = !!items.find((item: any) => item.id === this.courseId);
        }

        const savedCart = localStorage.getItem('cart_items');
        if (savedCart) {
          const cItems = JSON.parse(savedCart);
          this.isAddedToCart = !!cItems.find((item: any) => item.id === this.courseId);
        }

        if (this.course?.has_access) {
          this.loadQuizzes(id);
          this.loadLessonsProgress(id);
        }
      },
      error: (err) => {
        console.error('Failed to load course', err);
        this.hasError = true;
        this.errorMessage = err.message || 'Terjadi kesalahan sistem.';
        this.isLoading = false;
      }
    });
  }

  /** Resolves thumbnail to a full URL */
  getThumbnail(): string | null {
    if (!this.course) return null;
    const raw = this.course.thumbnail || this.course.image || this.course.cover_image
      || this.course.cover || this.course.image_url
      || this.course.thumbnail_path || this.course.image_path;
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return this.storageBaseUrl + raw.replace(/^\//, '');
  }

  /** Resolves instructor avatar to a full URL */
  getAvatar(): string | null {
    const avatarPath = this.course?.instructor?.avatar;
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) return avatarPath;
    return this.storageBaseUrl + avatarPath.replace(/^\//, '');
  }

  formatPrice(price: number | undefined): string {
    if (!price || price === 0) return 'Gratis';
    return 'Rp' + price.toLocaleString('id-ID');
  }

  formatDuration(duration: string | number | undefined): string {
    if (!duration) return '';
    return `${duration} mnt`;
  }

  goBack() {
    window.history.back();
  }

  setActiveTab(tab: 'description' | 'curriculum' | 'instructor' | 'reviews') {
    this.activeTab = tab;
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  toggleDescription() {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

  toggleInstructor() {
    this.isInstructorExpanded = !this.isInstructorExpanded;
  }

  async toggleWishlist() {
    this.isWishlisted = !this.isWishlisted;

    // Manage localStorage
    const saved = localStorage.getItem('wishlist_items');
    let wishlistItems: any[] = saved ? JSON.parse(saved) : [];

    if (this.isWishlisted && this.course) {
      if (!wishlistItems.find(item => item.id === this.course!.id)) {
        wishlistItems.push({
          id: this.course.id,
          title: this.course.title,
          instructor: this.course.instructor?.name || 'Instruktur',
          price: this.formatPrice(this.course.price),
          rating: this.course.rating || 0,
          students: this.course.total_students || 0,
          selected: false
        });
      }
    } else if (!this.isWishlisted && this.course) {
      wishlistItems = wishlistItems.filter(item => item.id !== this.course!.id);
    }
    localStorage.setItem('wishlist_items', JSON.stringify(wishlistItems));

    const msg = this.isWishlisted ? 'Ditambahkan ke wishlist' : 'Dihapus dari wishlist';
    const toast = await this.toastController.create({
      message: msg, duration: 1500, color: 'dark', position: 'bottom'
    });
    await toast.present();
  }

  async toggleCart() {
    this.isAddedToCart = !this.isAddedToCart;

    // Manage localStorage for cart
    const saved = localStorage.getItem('cart_items');
    let cartItems: any[] = saved ? JSON.parse(saved) : [];

    if (this.isAddedToCart && this.course) {
      if (!cartItems.find(item => item.id === this.course!.id)) {
        cartItems.push({
          id: this.course.id,
          title: this.course.title,
          instructor: this.course.instructor?.name || 'Instruktur',
          price: this.formatPrice(this.course.price),
          rawPrice: this.course.price,
          rating: this.course.rating || 0,
          students: this.course.total_students || 0,
          thumbnail: this.getThumbnail()
        });
      }
    } else if (!this.isAddedToCart && this.course) {
      cartItems = cartItems.filter(item => item.id !== this.course!.id);
    }
    localStorage.setItem('cart_items', JSON.stringify(cartItems));

    const msg = this.isAddedToCart ? 'Ditambahkan ke keranjang' : 'Dihapus dari keranjang';
    const toast = await this.toastController.create({
      message: msg, duration: 1500, color: 'dark', position: 'bottom'
    });
    await toast.present();
  }

  buyNow() {
    if (this.course?.has_access) {
      // User sudah enrolled — langsung ke materi
      this.goToVideoMateri();
      return;
    }
    // Tampilkan custom payment modal
    this.showPaymentModal = true;
  }

  closePaymentModal() {
    this.showPaymentModal = false;
  }

  async confirmPayment() {
    this.showPaymentModal = false;
    await this.createTransactionAndRedirect();
  }

  async createTransactionAndRedirect() {
    const loading = await this.loadingController.create({
      message: 'Membuat transaksi...',
      spinner: 'crescent'
    });
    await loading.present();

    this.transactionService.createTransaction(this.courseId).subscribe({
      next: async (tx) => {
        await loading.dismiss();
        const toast = await this.toastController.create({
          message: '✅ Transaksi dibuat! Silakan upload bukti transfer.',
          duration: 3000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
        // Arahkan ke halaman history tab transaksi untuk upload bukti
        this.router.navigate(['/history']);
      },
      error: async (err) => {
        await loading.dismiss();
        // Jika transaksi sudah ada sebelumnya, arahkan langsung ke history
        if (err.message?.includes('sudah ada') || err.message?.includes('pending')) {
          this.showToast('Transaksi sudah ada. Silakan upload bukti di halaman History.');
          this.router.navigate(['/history']);
          return;
        }
        const toast = await this.toastController.create({
          message: 'Gagal membuat transaksi: ' + (err.message || 'Error server'),
          duration: 3000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    });
  }

  goToVideoMateri(lessonId?: number) {
    const params: any = { course_id: this.courseId };
    if (lessonId) params['lesson_id'] = lessonId;
    this.router.navigate(['/video-materi'], { queryParams: params });
  }

  loadQuizzes(courseId: number) {
    this.isLoadingQuizzes = true;
    this.quizService.getStudentQuizzes(courseId).subscribe({
      next: (data) => {
        this.quizzes = data;
        this.isLoadingQuizzes = false;
      },
      error: (err) => {
        console.error('Failed to load quizzes', err);
        this.isLoadingQuizzes = false;
      }
    });
  }

  /** Load all reviews for the course */
  loadReviews() {
    if (!this.courseId) return;
    this.loadingReviews = true;
    this.reviewService.getCourseReviews(this.courseId).subscribe({
      next: (rev) => {
        this.reviews = rev;
        this.loadingReviews = false;
      },
      error: (err) => {
        console.error('Failed to load reviews', err);
        this.loadingReviews = false;
      }
    });
  }

  /** Load current user's review (if any) */
  loadMyReview() {
    if (!this.courseId) return;
    this.reviewService.getMyReview(this.courseId).subscribe({
      next: (rev) => {
        this.myReview = rev;
      },
      error: (err) => {
        console.error('Failed to load my review', err);
      }
    });
  }

  /** Submit new or updated review */
  async submitReview(rating: number | null, comment: string) {
    if (!this.courseId || rating === null) return;
    this.submittingReview = true;
    const action = this.myReview ?
      this.reviewService.updateReview(this.myReview.id, rating as number, comment) :
      this.reviewService.createReview(this.courseId, rating as number, comment);
    action.subscribe({
      next: async (rev) => {
        this.myReview = rev;
        await this.showToast('Review berhasil disimpan');
        this.loadReviews();
        this.submittingReview = false;
      },
      error: async (err) => {
        console.error('Failed to submit review', err);
        await this.showToast('Gagal menyimpan review');
        this.submittingReview = false;
      }
    });
  }

  /** Delete user's review */
  async deleteMyReview() {
    if (!this.myReview) return;
    const confirm = await this.alertController.create({
      header: 'Hapus Review',
      message: 'Apakah kamu yakin ingin menghapus review ini?',
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Hapus',
          handler: () => {
            this.reviewService.deleteReview(this.myReview!.id).subscribe({
              next: async () => {
                this.myReview = null;
                await this.showToast('Review dihapus');
                this.loadReviews();
              },
              error: async (err) => {
                console.error('Failed to delete review', err);
                await this.showToast('Gagal menghapus review');
              }
            });
          }
        }
      ]
    });
    await confirm.present();
  }


  loadLessonsProgress(courseId: number) {
    this.courseService.getLessons(courseId).subscribe({
      next: (lessons) => {
        if (this.course) {
          this.course.lessons = lessons;
        }
      },
      error: (err) => {
        console.error('Failed to load lessons progress', err);
      }
    });
  }

  goToQuiz(quiz: Quiz) {
    if (!this.course?.has_access) {
      this.showToast('Kamu harus membeli course ini terlebih dahulu');
      return;
    }
    // Asumsi route ke halaman quiz
    this.router.navigate(['/quiz-attempt', quiz.id], { queryParams: { course_id: this.courseId } }).catch(() => {
      this.showToast('Halaman Quiz belum tersedia/dibuat di frontend.');
    });
  }

  async showToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      color: 'dark',
      position: 'bottom'
    });
    await toast.present();
  }

  async copyRekening(rekening: string) {
    try {
      await navigator.clipboard.writeText(rekening);
      const toast = await this.toastController.create({
        message: 'Nomor rekening berhasil disalin!',
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
    } catch (err) {
      console.error('Failed to copy', err);
    }
  }
}

