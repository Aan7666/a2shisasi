import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';

interface Slide {
  id: number;
  title: string;
  badge: string;
  description: string;
}

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class WelcomePage implements OnInit, OnDestroy {
  @ViewChild('slidesContainer', { static: false }) slidesContainer!: ElementRef;

  activeSlide = 0;
  private slideInterval: any;

  slides: Slide[] = [
    {
      id: 4,
      title: 'Jelajahi Course yang Anda Minati',
      badge: 'EXPLORE',
      description: 'Cari dan dapatkan akses ke materi pembelajaran premium berkualitas tinggi dari para profesional.'
    },
    {
      id: 2,
      title: 'Simpan Course yang Anda Minati',
      badge: 'WISHLIST',
      description: 'Simpan kelas favoritmu ke dalam wishlist agar dapat dipelajari kapan pun kamu mau.'
    },
    {
      id: 5,
      title: 'Tempat Anda Akan Mempelajari Course',
      badge: 'MY LEARNING',
      description: 'Akses seluruh daftar pembelajaranmu secara cepat, terstruktur, dan efisien.'
    },
    {
      id: 3,
      title: 'Lihat Progres Anda',
      badge: 'PROGRES BELAJAR',
      description: 'Pantau kemajuan pembelajaranmu dan raih sertifikat setelah menyelesaikan kelas.'
    },
    {
      id: 1,
      title: 'Selamat Mengerjakan',
      badge: 'STUDY TIME',
      description: 'Pelajari materi teks & video, ikuti ujian dengan tekun, dan selesaikan kelas dengan sukses.'
    }
  ];

  constructor(private router: Router) { }

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  startAutoSlide() {
    this.slideInterval = setInterval(() => {
      this.autoNext();
    }, 5500);
  }

  stopAutoSlide() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  autoNext() {
    const nextIdx = (this.activeSlide + 1) % this.slides.length;
    this.scrollToSlide(nextIdx);
  }

  onScroll(event: any) {
    const container = event.target;
    const width = container.clientWidth;
    if (width > 0) {
      // Math.round ensures we update the current dot indicator dynamically
      this.activeSlide = Math.round(container.scrollLeft / width);
    }
  }

  selectSlide(index: number) {
    this.scrollToSlide(index);
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  scrollToSlide(index: number) {
    if (this.slidesContainer) {
      const container = this.slidesContainer.nativeElement;
      container.scrollTo({
        left: index * container.clientWidth,
        behavior: 'smooth'
      });
      this.activeSlide = index;
    }
  }

  nextOrFinish() {
    if (this.activeSlide < this.slides.length - 1) {
      this.selectSlide(this.activeSlide + 1);
    } else {
      this.finishWelcome();
    }
  }

  finishWelcome() {
    this.stopAutoSlide();
    localStorage.setItem('has_seen_welcome', 'true');

    // Cek apakah user sudah setuju privacy policy
    const accepted = localStorage.getItem('privacy_policy_accepted');
    if (accepted === 'true') {
      this.router.navigate(['/login'], { replaceUrl: true });
    } else {
      this.router.navigate(['/privacy-policy'], { replaceUrl: true });
    }
  }
}
