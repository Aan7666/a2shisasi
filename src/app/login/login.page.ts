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

  // Fungsi untuk kembali ke halaman utama / home
 // Fungsi untuk kembali ke halaman utama / home
goHome() {
  this.router.navigate(['/tabs/home']); // <-- ganti dari '/home' ke '/tabs/home'
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
        this.router.navigate(['/tabs/home']); // <-- ganti dari '/tabs-after-login'
      } else {
        alert(result.message || 'Login failed.');
      }
    },
    error: (err) => {
      console.error(err);
      const errMsg = err.error?.message || 'Email atau password salah!';
      alert(errMsg);
    }
  });
}

loginWithGoogle() {
  console.log('Login dengan Google...');
  const mockGoogleEmail = 'google.user@example.com';
  
  this.authService.register({
    email: mockGoogleEmail,
    fullName: 'Google User',
    password: 'google_password'
  });
  
  this.authService.loginLocal(mockGoogleEmail, 'google_password');
  alert('Google Login successful!');
  this.router.navigate(['/tabs/home']); // <-- ganti dari '/tabs-after-login'
}
}