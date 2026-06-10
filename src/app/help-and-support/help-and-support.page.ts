import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-help-and-support',
  templateUrl: './help-and-support.page.html',
  styleUrls: ['./help-and-support.page.scss'],
  standalone: false
})
export class HelpAndSupportPage implements OnInit {
  faqOpen: number | null = null; // Menyimpan ID FAQ yang sedang dibuka

  // Menggunakan NavController agar transisi kembali lebih smooth khas aplikasi mobile
  constructor(private navCtrl: NavController) { }

  ngOnInit() {
  }

  goBack() {
    this.navCtrl.back();
  }

  toggleFaq(id: number) {
    // Jika FAQ yang diklik sudah terbuka, maka tutup (null). Jika tidak, buka ID tersebut.
    this.faqOpen = this.faqOpen === id ? null : id;
  }

  contactWhatsApp() {
    window.open('https://wa.me/628XXXXXXXXXX', '_system');
  }

  contactEmail() {
    window.open('mailto:support@a2shi.com', '_system');
  }
}