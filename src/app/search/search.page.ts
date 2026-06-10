import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface Category {
  title: string;
  icon: string;
  color: string;
  background: string;
}

@Component({
  selector: 'app-search',
  templateUrl: 'search.page.html',
  styleUrls: ['search.page.scss'],
  standalone: false,
})
export class SearchPage implements OnInit {
  searchQuery: string = '';

  // STATE KONTROL UX BARU
  isFocused: boolean = false;
  isSearched: boolean = false;

  topSearches: string[] = [
    'word', 'excel', 'desain', 'musik', 'c#',
    'sql', 'python', 'php', 'cyber security'
  ];

  categories: Category[] = [
    { title: 'Web Development', icon: 'code-slash-outline', color: '#852920', background: 'rgba(133, 41, 32, 0.08)' },
    { title: 'Mobile Development', icon: 'phone-portrait-outline', color: '#2980b9', background: 'rgba(41, 128, 185, 0.08)' },
    { title: 'Cyber Security', icon: 'shield-checkmark-outline', color: '#27ae60', background: 'rgba(39, 174, 96, 0.08)' },
    { title: 'Graphic Design', icon: 'color-palette-outline', color: '#8e44ad', background: 'rgba(142, 68, 173, 0.08)' },
    { title: 'Music & Audio', icon: 'musical-notes-outline', color: '#d35400', background: 'rgba(211, 84, 0, 0.08)' },
    { title: 'Office Productivity', icon: 'briefcase-outline', color: '#2c3e50', background: 'rgba(44, 62, 80, 0.08)' }
  ];

  // Filter States
  selectedSort: string = 'Top Rating';
  isSortDropdownOpen: boolean = false;
  sortOptions: string[] = ['Top Rating', 'Newest', 'Lowest Price', 'Highest Price'];
  selectedPrice: string = 'Paid';
  ratingFilters = [
    { value: 5, label: '5', checked: false },
    { value: 4, label: '≥ 4', checked: false },
    { value: 3, label: '≥ 3', checked: false },
    { value: 2, label: '≥ 2', checked: false },
    { value: 1, label: '≥ 1', checked: false }
  ];

  constructor() { }

  ngOnInit() {
  }

  // FUNGSI AKTIVITAS INPUT BARU
  onFocus() {
    this.isFocused = true;
    this.isSearched = false; // Reset status hasil agar tombol Cancel muncul kembali
  }

  onSearchSubmit(event?: any) {
    if (event) event.preventDefault();
    
    if (this.searchQuery.trim() !== '') {
      this.isSearched = true;
      this.isFocused = false; // Menyembunyikan Cancel, bersiap menampilkan icon filters
      this.onSearch();
    }
  }

  onSearch() {
    console.log('Searching for:', this.searchQuery);
  }

  selectSearch(term: string) {
    this.searchQuery = term;
    this.isSearched = true;
    this.isFocused = false;
    this.onSearch();
  }

  // Filter Methods
  toggleSortDropdown() {
    this.isSortDropdownOpen = !this.isSortDropdownOpen;
  }

  selectSortOption(option: string) {
    this.selectedSort = option;
    this.isSortDropdownOpen = false;
  }

  selectPrice(price: string) {
    this.selectedPrice = this.selectedPrice === price ? '' : price;
  }

  toggleRatingFilter(rate: any) {
    rate.checked = !rate.checked;
  }

  resetFilters() {
    this.selectedSort = 'Top Rating';
    this.isSortDropdownOpen = false;
    this.selectedPrice = 'Paid';
    this.ratingFilters.forEach(r => r.checked = false);
  }

  applyFilters() {
    console.log('Applying Filters:', {
      sort: this.selectedSort,
      price: this.selectedPrice,
      ratings: this.ratingFilters.filter(r => r.checked).map(r => r.value)
    });
  }

  clearSearch() {
    this.searchQuery = '';
    // Tetap biarkan isFocused true agar setelah klik X user bisa mengetik kembali dengan teks Cancel tetap ada
    this.onSearch();
  }

  cancelSearch() {
    this.searchQuery = '';
    this.isFocused = false;
    this.isSearched = false;
    this.onSearch();
  }
}