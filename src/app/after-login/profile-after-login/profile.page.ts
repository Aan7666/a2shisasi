import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class ProfilePage implements OnInit {
  isLoggedIn: boolean = false;
  userName: string = '';
  userEmail: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private modalController: ModalController
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
    console.log('Navigating to /about-us page...');
    this.router.navigate(['/about-us']);
  }

  onHelpSupport() {
    console.log('Navigating to /help-and-support page...');
    this.router.navigate(['/help-and-support']);
  }

  closeHelp() {
    this.modalController.dismiss();
  }

  goToHistory() {
    console.log('Navigating to /history page...');
    this.router.navigate(['/history']);
  }
}