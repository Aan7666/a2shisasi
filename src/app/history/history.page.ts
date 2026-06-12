import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

interface TransactionHistory {
  id: string;
  invoice: string;
  courseTitle: string;
  price: string;
  date: string;
  status: 'success' | 'pending' | 'cancelled';
  paymentMethod: string;
}

interface LearningProgress {
  id: string;
  courseTitle: string;
  progress: number; // 0 to 100
  lastLesson: string;
  completed: boolean;
}

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HistoryPage implements OnInit {
  activeTab: 'transactions' | 'progress' = 'transactions';

  transactions: TransactionHistory[] = [
    {
      id: 'tx-1',
      invoice: 'INV/20260603/FG/9821',
      courseTitle: 'Belajar Figma dari awal sampai mahir',
      price: 'Rp150.000',
      date: '03 Jun 2026, 14:22',
      status: 'success',
      paymentMethod: 'Dana e-Wallet'
    },
    {
      id: 'tx-2',
      invoice: 'INV/20260520/WD/4829',
      courseTitle: 'Web Development Bootcamp: HTML, CSS & JS',
      price: 'Rp250.000',
      date: '20 Mei 2026, 09:15',
      status: 'success',
      paymentMethod: 'BCA Virtual Account'
    },
    {
      id: 'tx-3',
      invoice: 'INV/20260602/UX/1129',
      courseTitle: 'UI/UX Design Masterclass 2026',
      price: 'Rp180.000',
      date: '02 Jun 2026, 19:40',
      status: 'pending',
      paymentMethod: 'Mandiri Virtual Account'
    },
    {
      id: 'tx-4',
      invoice: 'INV/20260510/PY/0091',
      courseTitle: 'Python Pemrograman untuk Pemula',
      price: 'Rp120.000',
      date: '10 Mei 2026, 11:02',
      status: 'cancelled',
      paymentMethod: 'GoPay e-Wallet'
    }
  ];

  learningProgressList: LearningProgress[] = [
    {
      id: 'lp-1',
      courseTitle: 'Belajar Figma dari awal sampai mahir',
      progress: 66,
      lastLesson: 'Bagian 1: Pelajaran 2 - Tambah warna dan gradient warna',
      completed: false
    },
    {
      id: 'lp-2',
      courseTitle: 'Web Development Bootcamp: HTML, CSS & JS',
      progress: 100,
      lastLesson: 'Bagian 10: Pelajaran 5 - Kesimpulan & Roadmap Selanjutnya',
      completed: true
    },
    {
      id: 'lp-3',
      courseTitle: 'UI/UX Design Masterclass 2026',
      progress: 0,
      lastLesson: 'Belum dimulai',
      completed: false
    }
  ];

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
  }

  goBack() {
    window.history.back();
  }

  setActiveTab(tab: 'transactions' | 'progress') {
    this.activeTab = tab;
  }

  async showInvoiceDetail(tx: TransactionHistory) {
    let statusLabel = '';
    let statusColor = '';

    switch (tx.status) {
      case 'success':
        statusLabel = 'SUKSES';
        statusColor = '#2ecc71';
        break;
      case 'pending':
        statusLabel = 'MENUNGGU PEMBAYARAN';
        statusColor = '#e67e22';
        break;
      case 'cancelled':
        statusLabel = 'DIBATALKAN';
        statusColor = '#e74c3c';
        break;
    }

    const alert = await this.alertController.create({
      header: 'Detail Transaksi',
      subHeader: tx.invoice,
      message: `
        <div style="text-align: left; font-size: 13px; line-height: 1.5; color: #333;">
          <p><strong>Kelas:</strong><br/>${tx.courseTitle}</p>
          <p><strong>Tanggal:</strong><br/>${tx.date}</p>
          <p><strong>Metode Pembayaran:</strong><br/>${tx.paymentMethod}</p>
          <p><strong>Total Bayar:</strong><br/><span style="font-size: 15px; font-weight: 700; color: #852920;">${tx.price}</span></p>
          <p><strong>Status:</strong><br/><span style="color: ${statusColor}; font-weight: 700;">${statusLabel}</span></p>
        </div>
      `,
      buttons: [
        {
          text: 'Tutup',
          role: 'cancel'
        },
        {
          text: tx.status === 'pending' ? 'Bayar Sekarang' : 'Bantuan',
          handler: () => {
            if (tx.status === 'pending') {
              this.showToast('Membuka gerbang pembayaran...');
            } else {
              this.showToast('Menghubungi support...');
            }
          }
        }
      ],
      cssClass: 'invoice-alert'
    });

    await alert.present();
  }

  continueCourse(course: LearningProgress) {
    if (course.courseTitle.toLowerCase().includes('figma')) {
      this.router.navigate(['/video-materi']);
    } else {
      this.router.navigate(['/detail-course']);
    }
  }

  async claimCertificate(course: LearningProgress) {
    const alert = await this.alertController.create({
      header: 'Selamat!',
      subHeader: 'Klaim Sertifikat Anda',
      message: `Selamat Anda telah menyelesaikan kelas <strong>${course.courseTitle}</strong>. Sertifikat kelulusan digital Anda telah diterbitkan secara otomatis!`,
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Unduh PDF',
          handler: () => {
            this.showToast('Mengunduh sertifikat...');
          }
        }
      ]
    });

    await alert.present();
  }

  async showToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1500,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
  }
}
