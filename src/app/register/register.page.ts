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

  // Wizard state properties
  step: number = 1;
  email: string = '';
  otpCode: string = '';
  fullName: string = '';
  password: string = '';
  confirmPassword: string = '';

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

    // Fungsi untuk kembali ke halaman utama / home
  goHome() {
    // Mengarahkan ke rute tabs yang membungkus folder before-login
    this.router.navigate(['/tabs/home']);
  }

  nextStep() {
    if (this.step === 1) {
      if (this.email.trim() && this.email.includes('@')) {
        this.step = 2;
      } else {
        alert('Please enter a valid email address.');
      }
    } else if (this.step === 2) {
      if (this.otpCode.trim() && this.otpCode.length === 6) {
        this.step = 3;
      } else {
        alert('Please enter a valid 6-digit OTP code.');
      }
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

  onRegister() {
    if (!this.fullName.trim()) {
      alert('Please enter your full name.');
      return;
    }
    if (!this.password || this.password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    
    const result = this.authService.register({
      email: this.email,
      fullName: this.fullName,
      password: this.password
    });

    if (result.success) {
      alert('Registration successful! Please login.');
      // Redirect to login page upon success
      this.router.navigate(['/login']);
    } else {
      alert(result.message);
    }
  }

  registerWithGoogle() {
    console.log('Register dengan Google...');
    // Mock successful sign in with Google
    this.email = 'google.user@example.com';
    this.step = 2;
  }
}
