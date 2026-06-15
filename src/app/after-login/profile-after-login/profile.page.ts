import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
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

  isNameModalOpen: boolean = false;
  tempName: string = '';
  isSavingName: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private modalController: ModalController,
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

  // ── EDIT NAME MODAL ──────────────────────────────────────
  openNameModal() {
    this.tempName = this.userName;
    this.isNameModalOpen = true;
  }

  closeNameModal() {
    this.isNameModalOpen = false;
  }

  saveName() {
    if (!this.tempName.trim()) {
      this.showToast('Nama tidak boleh kosong.');
      return;
    }
    this.isSavingName = true;
    this.authService.updateName(this.tempName.trim()).subscribe({
      next: () => {
        this.isSavingName = false;
        this.userName = this.tempName.trim();
        this.closeNameModal();
        this.showToast('Nama berhasil diperbarui.');
      },
      error: (err) => {
        this.isSavingName = false;
        const msg = err.error?.message || 'Gagal memperbarui nama.';
        this.showToast(msg);
      }
    });
  }

  // ── DELETE ACCOUNT ────────────────────────────────────────
  async confirmDeleteAccount() {
    const alert = await this.alertController.create({
      header: 'Hapus Akun?',
      message: 'Apakah Anda yakin ingin menghapus akun secara permanen? Tindakan ini tidak dapat dibatalkan dan seluruh data pembelajaran Anda akan hilang.',
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
        // Fallback: force session clear and go to login
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