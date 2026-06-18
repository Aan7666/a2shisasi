import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Browser } from '@capacitor/browser';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.page.html',
  styleUrls: ['./privacy-policy.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PrivacyPolicyPage {
  isAccepted = false;
  private router = inject(Router);

  async openTerms() {
    await Browser.open({ url: 'https://sites.google.com/view/a2shi-terms/halaman-muka' });
  }

  async openPrivacy() {
    await Browser.open({ url: 'https://sites.google.com/view/a2shi-academy-privacy-policy/halaman-muka' });
  }

  onAgree() {
    if (this.isAccepted) {
      localStorage.setItem('privacy_policy_accepted', 'true');
      this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }
}
