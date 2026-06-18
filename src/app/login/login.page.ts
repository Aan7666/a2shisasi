import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Browser } from '@capacitor/browser';
import { environment } from '../../environments/environment';

interface Star {
  size: number;
  top: number;
  left: number;
  opacity: number;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class LoginPage implements OnInit {
  stars: Star[] = [];
  email = '';
  password = '';
  isLoading = false;
  showPassword = false;

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit() {
    this.generateStars();
  }

  generateStars() {
    this.stars = Array.from({ length: 20 }, () => ({
      size: Math.random() * 4 + 2,
      top: Math.random() * 40,
      left: Math.random() * 100,
      opacity: Math.random()
    }));
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    if (!this.email.trim() || !this.password) {
      alert('Please enter both email and password.');
      return;
    }

    this.isLoading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.router.navigate(['/tabs-after-login']);
        } else {
          alert(result.message || 'Login gagal.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        const errMsg = err.error?.message || 'Email atau password salah!';
        alert(errMsg);
      }
    });
  }


  async loginWithGoogle() {
    try {
      const result = await this.authService.getGoogleAuthUrl();
      if (result?.data?.url) {
        // UBAH DARI: window.open(result.data.url, '_system');
        // MENJADI:
        await Browser.open({ url: result.data.url });
      } else {
        alert('Gagal mendapatkan URL Google.');
      }
    } catch (err) {
      alert('Terjadi kesalahan. Coba lagi.');
    }
  }

  async openTerms() {
    await Browser.open({ url: 'https://sites.google.com/view/a2shi-terms/halaman-muka' });
  }

  async openPrivacy() {
    await Browser.open({ url: 'https://sites.google.com/view/a2shi-academy-privacy-policy/halaman-muka' });
  }
}