import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class SplashPage implements OnInit {

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit() {
    setTimeout(() => {
      // Kalau sudah login, langsung masuk tanpa harus login lagi
      if (this.authService.isLoggedIn()) {
        this.router.navigateByUrl('/tabs-after-login', { replaceUrl: true });
        return;
      }

      // Belum login: cek apakah sudah accept privacy policy
      const accepted = localStorage.getItem('privacy_policy_accepted');
      if (accepted === 'true') {
        this.router.navigateByUrl('/login', { replaceUrl: true });
      } else {
        this.router.navigateByUrl('/privacy-policy', { replaceUrl: true });
      }
    }, 3000);
  }
}
