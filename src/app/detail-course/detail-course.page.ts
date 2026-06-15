import { Component, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CourseService, CourseDetail } from '../services/course.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-detail-course',
  templateUrl: './detail-course.page.html',
  styleUrls: ['./detail-course.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, TitleCasePipe]
})
export class DetailCoursePage implements OnInit {
  activeTab: 'description' | 'curriculum' | 'instructor' = 'description';
  isDescriptionExpanded: boolean = false;
  isInstructorExpanded: boolean = false;

  // Wishlist / Cart state (UI-only for now)
  isWishlisted: boolean = false;
  isAddedToCart: boolean = false;

  // API data
  course: CourseDetail | null = null;
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  courseId: number = 0;

  private readonly storageBaseUrl = environment.apiUrl.replace('/api', '/storage/');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private toastController: ToastController
  ) { }

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

  loadCourse(id: number) {
    this.isLoading = true;
    this.hasError = false;

    this.courseService.getCourseDetail(id).subscribe({
      next: (data) => {
        this.course = data;
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

  setActiveTab(tab: 'description' | 'curriculum' | 'instructor') {
    this.activeTab = tab;
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

  async buyNow() {
    if (this.course?.has_access) {
      // User already enrolled — go directly to first lesson
      this.goToVideoMateri();
    } else {
      this.router.navigate(['/checkout'], { queryParams: { course_id: this.courseId } });
    }
  }

  goToVideoMateri(lessonId?: number) {
    const params: any = { course_id: this.courseId };
    if (lessonId) params['lesson_id'] = lessonId;
    this.router.navigate(['/video-materi'], { queryParams: params });
  }
}

