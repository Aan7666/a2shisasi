import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-lupa-password',
  templateUrl: './lupa-password.page.html',
  styleUrls: ['./lupa-password.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LupaPasswordPage implements OnInit, OnDestroy {
  step: number = 1;
  emailAddress: string = '';
  otpCode: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;

  showNewPassword = false;
  showConfirmPassword = false;

  resendCooldown: number = 0;
  private countdownInterval: any = null;

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit() { }

  ngOnDestroy() {
    this.clearCountdown();
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
    this.showConfirmPassword = this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
    this.showNewPassword = this.showConfirmPassword;
  }

  startResendCountdown() {
    this.resendCooldown = 60;
    this.clearCountdown();
    this.countdownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        this.resendCooldown = 0;
        this.clearCountdown();
      }
    }, 1000);
  }

  clearCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  onResendOtp() {
    if (this.resendCooldown > 0 || this.isLoading) return;
    this.isLoading = true;
    this.authService.forgotPassword(this.emailAddress.trim()).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.startResendCountdown();
          alert('Kode OTP baru telah dikirim ke email Anda.');
        } else {
          alert(result.message || 'Gagal mengirim ulang OTP.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        alert(err.error?.message || 'Gagal mengirim ulang OTP.');
      }
    });
  }

  onSendOtp() {
    if (!this.emailAddress.trim()) {
      alert('Please enter your email address.');
      return;
    }
    this.isLoading = true;
    this.authService.forgotPassword(this.emailAddress.trim()).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.step = 2;
          this.startResendCountdown();
        } else {
          alert(result.message || 'Gagal mengirim OTP.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        alert(err.error?.message || 'Email tidak ditemukan.');
      }
    });
  }

  onVerifyOtp() {
    if (!this.otpCode.trim()) {
      alert('Please enter the OTP code.');
      return;
    }
    this.isLoading = true;
    this.authService.verifyForgotOtp(this.emailAddress, this.otpCode).subscribe({
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

  onResetPassword() {
    if (!this.newPassword || !this.confirmPassword) {
      alert('Please fill in all fields.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      alert('Password tidak cocok.');
      return;
    }
    if (this.newPassword.length < 8) {
      alert('Password minimal 8 karakter.');
      return;
    }
    this.isLoading = true;
    this.authService.resetPassword(this.emailAddress, this.newPassword, this.confirmPassword).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          alert('Password berhasil direset! Silakan login.');
          this.router.navigate(['/login']);
        } else {
          alert(result.message || 'Gagal reset password.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        alert(err.error?.message || 'Gagal reset password.');
      }
    });
  }

  onClose() {
    this.router.navigate(['/login']);
  }
}