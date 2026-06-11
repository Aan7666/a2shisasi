import { Component } from '@angular/core';
import { Platform, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Location } from '@angular/common';

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
    private location: Location
  ) {
    this.initializeApp();
  }

  initializeApp() {
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
