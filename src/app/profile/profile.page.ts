import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProfilePage implements OnInit {
  isLoggedIn: boolean = false;
  userName: string = 'Bruno Fernando';
  userEmail: string = 'brunofernando21@gmail.com';

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
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
      // Default mock data matching the screenshot
      this.userName = 'Bruno Fernando';
      this.userEmail = 'brunofernando21@gmail.com';
    }
  }

  onSignOut() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        // Tetap logout lokal meski request gagal
        this.authService.clearSession();
        this.router.navigate(['/login']);
      }
    });
  }

  async confirmDeleteAccount() {
    const alert = await this.alertController.create({
      header: 'Hapus Akun?',
      message: 'Apakah Anda yakin ingin menghapus akun secara permanen? Tindakan ini tidak dapat dibatalkan dan seluruh data Anda akan hilang.',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Hapus',
          role: 'destructive',
          cssClass: 'danger-btn-alert',
          handler: () => {
            this.deleteAccount();
          }
        }
      ]
    });
    await alert.present();
  }

  deleteAccount() {
    this.authService.deleteAccount().subscribe({
      next: () => {
        this.showToast('Akun Anda berhasil dihapus.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        const msg = err.error?.message || 'Gagal menghapus akun.';
        this.showToast(msg);
        this.authService.clearSession();
        this.router.navigate(['/login']);
      }
    });
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
  }
}