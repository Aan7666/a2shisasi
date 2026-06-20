import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { Browser } from '@capacitor/browser';

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
  profileImageUrl: string | null = null;
  isUpdatingAvatar: boolean = false;

  isNameModalOpen: boolean = false;
  tempName: string = '';
  isSavingName: boolean = false;
  isDeleteConfirmed: boolean = false;
  isPopUpShowing: boolean = false;
  isInstructorModalOpen: boolean = false;

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

        // Resolve relative avatar URL from backend
        const avatarPath = currentUser.avatar || null;
        if (avatarPath) {
          if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://') || avatarPath.startsWith('data:')) {
            this.profileImageUrl = avatarPath;
          } else {
            const storageBaseUrl = environment.apiUrl.replace('/api', '/storage/');
            this.profileImageUrl = storageBaseUrl + avatarPath.replace(/^\//, '');
          }
        } else {
          this.profileImageUrl = null;
        }
      }
    } else {
      this.userName = '';
      this.userEmail = '';
      this.profileImageUrl = null;
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

  openInstructorModal() {
    this.isInstructorModalOpen = true;
  }

  onHelpSupport() {
    console.log('Navigating to /help-and-support page...');
    this.router.navigate(['/help-and-support']);
  }

  async openTerms() {
    await Browser.open({ url: 'https://sites.google.com/view/a2shi-terms/halaman-muka' });
  }

  async openPrivacy() {
    await Browser.open({ url: 'https://sites.google.com/view/a2shi-academy-privacy-policy/halaman-muka' });
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
        console.error('Error update name:', err);
        const msg = err.error?.message || 'Gagal memperbarui nama.';
        this.showToast(msg);
      }
    });
  }

  // ── DELETE ACCOUNT ────────────────────────────────────────
  async confirmDeleteAccount() {
    if (!this.isDeleteConfirmed) {
      this.showToast('Anda harus mencentang kotak persetujuan terlebih dahulu.');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Hapus Akun?',
      message: 'Apakah Anda yakin ingin menghapus akun secara permanen? Tindakan ini tidak dapat dibatalkan dan seluruh data pembelajaran Anda akan hilang.',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Lanjutkan',
          handler: () => {
            this.showFinalDeleteConfirmation();
          }
        }
      ]
    });
    await alert.present();
  }

  async showFinalDeleteConfirmation() {
    const finalAlert = await this.alertController.create({
      header: 'Peringatan Terakhir!',
      message: 'TINDAKAN INI PERMANEN. Semua data pembelian kelas, progres belajar, dan sertifikat Anda akan dihapus selamanya dari sistem. Apakah Anda BENAR-BENAR yakin?',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'YA, HAPUS PERMANEN',
          role: 'destructive',
          cssClass: 'danger-btn-alert',
          handler: () => {
            this.deleteAccount();
          }
        }
      ]
    });
    await finalAlert.present();
  }

  async onCheckboxChange(event: any) {
    const isChecked = event.detail.checked;

    // Hanya picu alert jika dicentang (checked === true) dan popup sedang tidak muncul
    if (isChecked && !this.isPopUpShowing) {
      this.isPopUpShowing = true;
      const alert = await this.alertController.create({
        header: 'Perhatian!',
        message: 'Mencentang kotak ini berarti Anda bersiap untuk menghapus akun secara permanen. Apakah Anda yakin ingin mencentangnya?',
        buttons: [
          {
            text: 'Batal',
            role: 'cancel',
            handler: () => {
              this.isDeleteConfirmed = false;
              this.isPopUpShowing = false;
            }
          },
          {
            text: 'Setuju',
            handler: () => {
              this.isPopUpShowing = false;
            }
          }
        ]
      });
      await alert.present();
    }
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

  // ── UPDATE AVATAR ───────────────────────────────────────
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Validasi tipe file (hanya PNG dan JPG/JPEG)
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      this.showToast('Format foto harus berupa PNG atau JPG.');
      return;
    }

    // Validasi ukuran (opsional, max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.showToast('Ukuran foto maksimal 2MB.');
      return;
    }

    this.isUpdatingAvatar = true;
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;

      // Send the base64 string along with the current username to satisfy any required backend validations
      this.authService.updateProfile({ name: this.userName, avatar: base64String }).subscribe({
        next: (response) => {
          this.isUpdatingAvatar = false;

          // Resolve newly uploaded avatar path if returned, otherwise fallback to local base64 preview
          if (response?.data?.avatar) {
            const avatarPath = response.data.avatar;
            if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
              this.profileImageUrl = avatarPath;
            } else {
              const storageBaseUrl = environment.apiUrl.replace('/api', '/storage/');
              this.profileImageUrl = storageBaseUrl + avatarPath.replace(/^\//, '');
            }
          } else {
            this.profileImageUrl = base64String;
          }

          this.showToast('Foto profil berhasil diperbarui.');
        },
        error: (err) => {
          this.isUpdatingAvatar = false;
          console.error('Error update profile avatar:', err);
          console.log('Validation Errors details:', err.error?.errors);
          let msg = 'Gagal memperbarui foto profil.';
          if (err.error?.errors) {
            const errorKeys = Object.keys(err.error.errors);
            const messages = errorKeys.map(key => err.error.errors[key].join(', '));
            msg = messages.join(' | ');
          } else if (err.error?.message) {
            msg = err.error.message;
          }
          this.showToast(msg);
        }
      });
    };
    reader.onerror = () => {
      this.isUpdatingAvatar = false;
      this.showToast('Gagal membaca file.');
    };
    reader.readAsDataURL(file);
  }

  // ── HELP & SUPPORT FAQ ──────────────────────────────────
  expandedFaq: string | null = null;

  toggleFaq(faq: string) {
    if (this.expandedFaq === faq) {
      this.expandedFaq = null;
    } else {
      this.expandedFaq = faq;
    }
  }

  sendEmailSupport() {
    // Gunakan window.location.href agar lebih kompatibel saat testing di web browser (localhost)
    // Di perangkat asli (Android/iOS), ini tetap akan memicu aplikasi email bawaan
    window.location.href = 'mailto:aishasupport@gmail.com?subject=Bantuan%20A2SHI%20Academy';
  }
}