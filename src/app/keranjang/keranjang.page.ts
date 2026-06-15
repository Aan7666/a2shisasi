import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-keranjang',
  templateUrl: './keranjang.page.html',
  styleUrls: ['./keranjang.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class KeranjangPage implements OnInit {
  cartItems: any[] = [];
  totalAmount: number = 0;

  constructor() { }

  ngOnInit() {
    this.loadCart();
  }

  ionViewWillEnter() {
    this.loadCart();
  }

  loadCart() {
    const saved = localStorage.getItem('cart_items');
    if (saved) {
      this.cartItems = JSON.parse(saved);
    } else {
      this.cartItems = [];
    }
    this.calculateTotal();
  }

  calculateTotal() {
    this.totalAmount = this.cartItems.reduce((sum, item) => sum + (item.rawPrice || 0), 0);
  }

  removeItem(item: any) {
    this.cartItems = this.cartItems.filter(i => i.id !== item.id);
    localStorage.setItem('cart_items', JSON.stringify(this.cartItems));
    this.calculateTotal();
  }
}
