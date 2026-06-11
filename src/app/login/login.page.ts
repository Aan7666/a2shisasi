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
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class LoginPage implements OnInit {

  stars: Star[] = [];

  // Form properties
  username = '';
  password = '';

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

  onLogin() {
    if (!this.username.trim() || !this.password) {
      alert('Please enter both email and password.');
      return;
    }

    this.authService.login(this.username, this.password).subscribe({
      next: (result) => {
        if (result.success) {
          alert(result.message || 'Login successful!');
          this.router.navigate(['/tabs-after-login']);
        } else {
          alert(result.message || 'Login failed.');
        }
      },
      error: (err) => {
        console.warn('API login failed, trying offline/local login...', err);
        // Fallback to local authentication
        const localResult = this.authService.loginLocal(this.username, this.password);
        if (localResult.success) {
          alert(localResult.message || 'Login successful (Offline Mode)!');
          this.router.navigate(['/tabs-after-login']);
        } else {
          console.error(err);
          const errMsg = err.error?.message || 'Email atau password salah!';
          alert(errMsg);
        }
      }
    });
  }

  fillDummyCredentials(role: 'user') {
    if (role === 'user') {
      this.username = 'user@gmail.com';
      this.password = 'user123';
    }
    this.onLogin();
  }

  loginWithGoogle() {
    console.log('Login dengan Google...');
    // Mock Google Login as a valid database session
    const mockGoogleEmail = 'google.user@example.com';
    // Register if doesn't exist, then login
    this.authService.register({
      email: mockGoogleEmail,
      fullName: 'Google User',
      password: 'google_password'
    });
    this.authService.loginLocal(mockGoogleEmail, 'google_password');
    alert('Google Login successful!');
    this.router.navigate(['/tabs-after-login']);
  }

  loginDummyDirect() {
    this.authService.loginLocal('user@gmail.com', 'user123');
    this.router.navigate(['/tabs-after-login']);
  }
}