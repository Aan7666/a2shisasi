import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.page.html',
  styleUrls: ['./about-us.page.scss'],
  standalone: false // Menggunakan false berarti modul diatur via about-us.module.ts
})
export class AboutUsPage implements OnInit {

  // Disarankan menggunakan NavController dari Ionic untuk navigasi balik yang lebih smooth
  constructor(private navCtrl: NavController) { }

  ngOnInit() {
  }

  goBack() {
    this.navCtrl.back();
  }
}