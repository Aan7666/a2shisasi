import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.page.html',
  styleUrls: ['./wishlist.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class WishlistPage implements OnInit {
  isLoggedIn: boolean = false;
  isSelectionMode: boolean = false;
  isAllSelected: boolean = false;

  filteredWishlistItems: any[] = [];
  isSearchBarOpen: boolean = false;
  searchQuery: string = '';

  wishlistItems: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.checkLoginStatus();
    this.loadWishlist();
  }

  async confirmDelete(item: any, event: Event) {
    event.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Hapus Wishlist',
      message: 'Apakah ingin menghapus course dari wishlist?',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: () => {
            this.deleteItem(item);
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteItem(item: any) {
    this.wishlistItems = this.wishlistItems.filter(i => i.id !== item.id);
    localStorage.setItem('wishlist_items', JSON.stringify(this.wishlistItems));
    this.filterWishlistItems();
    
    const toast = await this.toastController.create({
      message: 'Item berhasil dihapus',
      duration: 2000,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
  }

  loadWishlist() {
    const saved = localStorage.getItem('wishlist_items');
    if (saved) {
      this.wishlistItems = JSON.parse(saved);
    } else {
      this.wishlistItems = [];
    }
    this.filterWishlistItems();
  }

  onSelectItems() {
    this.isSelectionMode = true;
    this.isAllSelected = false;
    this.wishlistItems.forEach(item => item.selected = false);
  }

  cancelSelection() {
    this.isSelectionMode = false;
    this.isAllSelected = false;
    this.wishlistItems.forEach(item => item.selected = false);
  }

  toggleSelectAll() {
    this.isAllSelected = !this.isAllSelected;
    this.wishlistItems.forEach(item => item.selected = this.isAllSelected);
  }

  toggleItemSelection(item: any) {
    item.selected = !item.selected;
    this.isAllSelected = this.wishlistItems.every(i => i.selected);
  }

  async deleteSelected() {
    const selectedCount = this.wishlistItems.filter(item => item.selected).length;
    if (selectedCount === 0) {
      const toast = await this.toastController.create({
        message: 'Tidak ada item yang dipilih',
        duration: 1500,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Hapus Wishlist',
      message: 'Apakah ingin menghapus course dari wishlist?',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: async () => {
            this.wishlistItems = this.wishlistItems.filter(item => !item.selected);
            localStorage.setItem('wishlist_items', JSON.stringify(this.wishlistItems));
            this.filterWishlistItems();
            this.isAllSelected = false;
            this.isSelectionMode = false;

            const toast = await this.toastController.create({
              message: `${selectedCount} item berhasil dihapus`,
              duration: 2000,
              position: 'bottom',
              color: 'dark'
            });
            await toast.present();
          }
        }
      ]
    });
    await alert.present();
  }

  ionViewWillEnter() {
    this.checkLoginStatus();
    this.loadWishlist();
  }

  checkLoginStatus() {
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  redirectToLogin() {
    this.router.navigate(['/login']);
  }

  goToSearch() {
    this.router.navigate(['/tabs-after-login/search']);
  }

  goToDetail(item: any) {
    if (item && item.id) {
      this.router.navigate(['/detail-course', item.id]);
    }
  }

  toggleSearchBar() {
    this.isSearchBarOpen = !this.isSearchBarOpen;
    if (!this.isSearchBarOpen) {
      this.searchQuery = '';
      this.filterWishlistItems();
    }
  }

  filterWishlistItems() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredWishlistItems = [...this.wishlistItems];
    } else {
      this.filteredWishlistItems = this.wishlistItems.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.instructor.toLowerCase().includes(query)
      );
    }
  }
}
