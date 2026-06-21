import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { TransactionService } from '../services/transaction.service';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  arrowForwardOutline,
  informationCircleOutline,
  trashOutline,
  star,
  imageOutline,
  cartOutline,
  copyOutline
} from 'ionicons/icons';
import { forkJoin } from 'rxjs';

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
  showPaymentModal: boolean = false;

  constructor(
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private transactionService: TransactionService
  ) {
    addIcons({
      'cart-outline': cartOutline,
      'image-outline': imageOutline,
      'star': star,
      'trash-outline': trashOutline,
      'close-outline': closeOutline,
      'information-circle-outline': informationCircleOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'copy-outline': copyOutline
    });
  }

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

  formatPrice(price: number | undefined): string {
    if (price === undefined || price === null) return 'Rp0';
    return 'Rp' + price.toLocaleString('id-ID');
  }

  getCartItemsTitles(): string {
    if (this.cartItems.length === 0) return '';
    return this.cartItems.map(item => item.title).join(', ');
  }

  openPaymentModal() {
    this.showPaymentModal = true;
  }

  closePaymentModal() {
    this.showPaymentModal = false;
  }

  async confirmPayment() {
    this.showPaymentModal = false;
    await this.createTransactionsAndRedirect();
  }

  async createTransactionsAndRedirect() {
    if (this.cartItems.length === 0) return;

    const loading = await this.loadingController.create({
      message: 'Membuat transaksi...',
      spinner: 'crescent'
    });
    await loading.present();

    const requests = this.cartItems.map(item => this.transactionService.createTransaction(item.id));

    forkJoin(requests).subscribe({
      next: async (results) => {
        await loading.dismiss();

        const toast = await this.toastController.create({
          message: '✅ Transaksi berhasil dibuat! Silakan upload bukti transfer.',
          duration: 3000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();

        // Clear cart
        this.cartItems = [];
        localStorage.removeItem('cart_items');

        // Redirect to history
        this.router.navigate(['/history']);
      },
      error: async (err) => {
        await loading.dismiss();

        let errorMsg = err.message || 'Terjadi kesalahan saat checkout.';
        if (errorMsg.includes('sudah ada') || errorMsg.includes('pending')) {
          errorMsg = 'Transaksi sudah ada. Silakan upload bukti di halaman History.';
        }

        const toast = await this.toastController.create({
          message: errorMsg,
          duration: 3000,
          color: 'warning',
          position: 'bottom'
        });
        await toast.present();

        // Clear cart and redirect anyway so they can see existing transactions
        this.cartItems = [];
        localStorage.removeItem('cart_items');
        this.router.navigate(['/history']);
      }
    });
  }

  async copyRekening(rekening: string) {
    try {
      await navigator.clipboard.writeText(rekening);
      const toast = await this.toastController.create({
        message: 'Nomor rekening berhasil disalin!',
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
    } catch (err) {
      console.error('Failed to copy', err);
    }
  }
}

