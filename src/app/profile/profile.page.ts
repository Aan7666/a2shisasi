import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  standalone: false, // Karena false, modul dikelola oleh profile.module.ts
})
export class ProfilePage implements OnInit {
  isLoggedIn: boolean = false;
  userName: string = '';
  userEmail: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkLoginStatus();
  }

  ionViewWillEnter() {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.userName = currentUser.fullName;
        this.userEmail = currentUser.email;
      }
    } else {
      this.userName = '';
      this.userEmail = '';
    }
  }

  onSignIn() {
    this.router.navigate(['/login']);
  }

  onSignOut() {
    this.authService.logout();
    this.isLoggedIn = false;
    this.userName = '';
    this.userEmail = '';
    this.router.navigate(['/login']);
  }

  onAboutUs() {
    this.router.navigate(['/about-us']);
  }

  onHelpSupport() {
    this.router.navigate(['/help-and-support']);
  }
}