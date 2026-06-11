import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProfilePage implements OnInit {
  isLoggedIn: boolean = false;
  userName: string = '';
  userEmail: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

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
        this.userName = currentUser.name;
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
    this.authService.logout().subscribe({
      next: () => {
        this.isLoggedIn = false;
        this.userName = '';
        this.userEmail = '';
        this.router.navigate(['/login']);
      },
      error: () => {
        this.authService.clearSession();
        this.isLoggedIn = false;
        this.userName = '';
        this.userEmail = '';
        this.router.navigate(['/login']);
      }
    });
  }

  onAboutUs() {
    this.router.navigate(['/about-us']);
  }

  onHelpSupport() {
    this.router.navigate(['/help-and-support']);
  }
}