import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface Star {
  size: number;
  top: number;
  left: number;
  opacity: number;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class RegisterPage implements OnInit {
  stars: Star[] = [];
  step: number = 1;
  email: string = '';
  otpCode: string = '';
  fullName: string = '';
  password: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;

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

  nextStep() {
    if (this.step === 1) {
      this.onSendOtp();
    } else if (this.step === 2) {
      this.onVerifyOtp();
    } else if (this.step === 3) {
      this.onRegister();
    }
  }

  prevStep() {
    if (this.step > 1) {
      this.step--;
    } else {
      this.router.navigate(['/login']);
    }
  }

  onSendOtp() {
    if (!this.email.trim() || !this.email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    this.isLoading = true;
    this.authService.sendOtp(this.email.trim()).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.step = 2;
        } else {
          alert(result.message || 'Gagal mengirim OTP.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        alert(err.error?.message || 'Gagal mengirim OTP.');
      }
    });
  }

  onVerifyOtp() {
    if (!this.otpCode.trim() || this.otpCode.length !== 6) {
      alert('Please enter a valid 6-digit OTP code.');
      return;
    }
    this.isLoading = true;
    this.authService.verifyOtp(this.email, this.otpCode).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.step = 3;
        } else {
          alert(result.message || 'OTP tidak valid.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        alert(err.error?.message || 'OTP tidak valid atau sudah expired.');
      }
    });
  }

  onRegister() {
    if (!this.fullName.trim()) {
      alert('Please enter your full name.');
      return;
    }
    if (!this.password || this.password.length < 8) {
      alert('Password minimal 8 karakter.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    this.isLoading = true;
    this.authService.completeRegister({
      email: this.email,
      name: this.fullName,
      password: this.password,
      password_confirmation: this.confirmPassword
    }).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          alert('Registrasi berhasil! Silakan login.');
          this.router.navigate(['/login']);
        } else {
          alert(result.message || 'Registrasi gagal.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        alert(err.error?.message || 'Registrasi gagal.');
      }
    });
  }

  async registerWithGoogle() {
    try {
      const result = await this.authService.getGoogleAuthUrl();
      if (result?.data?.url) {
        window.open(result.data.url, '_system');
      } else {
        alert('Gagal mendapatkan URL Google.');
      }
    } catch (err) {
      alert('Terjadi kesalahan. Coba lagi.');
    }
  }
}