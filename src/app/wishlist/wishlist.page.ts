import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-wishlist',
  templateUrl: 'wishlist.page.html',
  styleUrls: ['wishlist.page.scss'],
  standalone: false,
})
export class WishlistPage implements OnInit {

  isLoggedIn: boolean = false;       // <-- default false, diisi dari AuthService
  isSelectionMode: boolean = false;
  isSearchMode: boolean = false;
  searchQuery: string = '';
  isActionSheetOpen: boolean = false;
  isAllSelected: boolean = false;

  wishlistItems: any[] = [];         // <-- kosong, diisi dari API nanti
  filteredItems: any[] = [];         // <-- kosong, tidak ada dummy

  public actionSheetButtons = [
    {
      text: 'Favorite Courses',
      handler: () => { this.filterWishlist('favorite'); }
    },
    {
      text: 'Downloaded Courses',
      handler: () => { this.filterWishlist('downloaded'); }
    },
    {
      text: 'Archived Courses',
      handler: () => { this.filterWishlist('archived'); }
    },
    {
      text: 'All Courses',
      handler: () => { this.filterWishlist('all'); }
    },
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => { this.setActionSheetOpen(false); }
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
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
    if (!this.isLoggedIn) {
      // Reset semua state saat logout
      this.wishlistItems = [];
      this.filteredItems = [];
      this.isSelectionMode = false;
      this.isSearchMode = false;
      this.searchQuery = '';
    }
  }

  openFilterSheet() {
    this.setActionSheetOpen(true);
  }

  setActionSheetOpen(isOpen: boolean) {
    this.isActionSheetOpen = isOpen;
  }

  filterWishlist(category: string) {
    console.log('Filter:', category);
    this.setActionSheetOpen(false);
    if (category === 'all') {
      this.filteredItems = [...this.wishlistItems];
    } else {
      this.filteredItems = this.wishlistItems.filter(item => item.category === category);
    }
  }

  toggleSearch() {
    this.isSearchMode = !this.isSearchMode;
    if (!this.isSearchMode) {
      this.searchQuery = '';
      this.onSearch();
    }
  }

  goToDetail(item: any) {
    this.router.navigate(['/detail-course']);
  }

  onSearch() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredItems = [...this.wishlistItems];
    } else {
      this.filteredItems = this.wishlistItems.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.instructor?.toLowerCase().includes(query)
      );
    }
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
    this.filteredItems = [...this.wishlistItems];
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

    this.wishlistItems = this.wishlistItems.filter(item => !item.selected);
    this.filteredItems = [...this.wishlistItems];
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

// Tambahkan ini
clearSearch() {
  this.searchQuery = '';
  this.onSearch();
}
}