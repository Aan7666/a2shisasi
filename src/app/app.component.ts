import { Component } from '@angular/core';
import { Platform, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Location } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private alertController: AlertController,
    private router: Router,
    private location: Location,
    private authService: AuthService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    App.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
      console.log('Deep link received:', event.url); // ← tambah ini
      const url = new URL(event.url);
      const token = url.searchParams.get('token');
      const userData = url.searchParams.get('user');
      const isNewUser = url.searchParams.get('is_new_user');
      console.log('token:', token); // ← tambah ini
      console.log('isNewUser:', isNewUser); // ← tambah ini
      await Browser.close();

      if (isNewUser === '1') {
        const data = JSON.parse(decodeURIComponent(url.searchParams.get('data') || '{}'));
        localStorage.setItem('google_register_data', JSON.stringify(data));
        this.router.navigate(['/register'], { queryParams: { step: 'google' } });
      } else if (token && userData) {
        const user = JSON.parse(decodeURIComponent(userData));
        localStorage.setItem('a2shi_token', token);
        localStorage.setItem('a2shi_user', JSON.stringify(user));
        this.router.navigate(['/tabs-after-login']);
      }
    });
    this.platform.ready().then(() => {
      this.setupBackButtonBehavior();
    });
  }

  setupBackButtonBehavior() {
    this.platform.backButton.subscribeWithPriority(10, async () => {
      const currentUrl = this.router.url.split('?')[0];
      console.log('Intercepted back button on URL:', currentUrl);

      const isBeforeLoginTab = currentUrl.startsWith('/tabs/');
      const isAfterLoginTab = currentUrl.startsWith('/tabs-after-login/');

      // List of root URLs where we prompt the user to exit the app
      const rootUrls = [
        '/login',
        '/splash',
        '/privacy-policy',
        '/tabs/home',
        '/tabs-after-login/home',
        '/'
      ];

      if (rootUrls.includes(currentUrl) || currentUrl === '') {
        await this.showExitConfirm();
      } else if (isBeforeLoginTab && currentUrl !== '/tabs/home') {
        this.router.navigateByUrl('/tabs/home');
      } else if (isAfterLoginTab && currentUrl !== '/tabs-after-login/home') {
        this.router.navigateByUrl('/tabs-after-login/home');
      } else {
        this.location.back();
      }
    });
  }

  async showExitConfirm() {
    const alert = await this.alertController.create({
      header: 'Konfirmasi',
      message: 'Apakah anda yakin ingin keluar ?',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel',
          handler: () => {
            console.log('Exit cancelled');
          }
        },
        {
          text: 'Keluar',
          handler: () => {
            App.exitApp();
          }
        }
      ]
    });

    await alert.present();
  }
}
