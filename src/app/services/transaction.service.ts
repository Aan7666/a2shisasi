import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from './course.interfaces';

// ── Interfaces ─────────────────────────────────────────────

export interface TransactionCourse {
  id: number;
  title: string;
  thumbnail: string | null;
  price: number;
}

export type TransactionStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED';

export interface Transaction {
  id: number;
  user_id: number;
  course_id: number;
  /** Nomor order, contoh: ORD-20240520-A1B2C3 */
  order_id?: string;
  /** Legacy: nomor invoice lama */
  invoice_number?: string;
  amount?: number;
  price?: number;
  payment_method?: string;
  status: TransactionStatus;
  proof_image: string | null;
  created_at: string;
  updated_at: string;
  course?: TransactionCourse;
}


export interface UploadProofResult {
  transactionId: number;
  proofImage: string;
  status: TransactionStatus;
}

// ── Service ────────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/student/transactions
   * Mengambil semua transaksi milik user yang sedang login.
   */
  getTransactions(): Observable<Transaction[]> {
    return this.http
      .get<ApiResponse<Transaction[]>>(`${this.apiUrl}/student/transactions`)
      .pipe(
        map(res => res.data),
        catchError(this.handleError)
      );
  }

  /**
   * GET /api/student/transactions/{id}
   * Mengambil detail satu transaksi berdasarkan ID.
   */
  getTransaction(id: number): Observable<Transaction> {
    return this.http
      .get<ApiResponse<Transaction>>(`${this.apiUrl}/student/transactions/${id}`)
      .pipe(
        map(res => res.data),
        catchError(this.handleError)
      );
  }

  /**
   * POST /api/student/transactions/{id}/upload-proof
   * Upload bukti transfer (FormData multipart/form-data).
   * @param id - ID transaksi
   * @param file - file gambar bukti transfer (jpg/jpeg/png, max 5 MB)
   */
  uploadProof(id: number, file: File): Observable<UploadProofResult> {
    const formData = new FormData();
    formData.append('proof_image', file);

    return this.http
      .post<ApiResponse<UploadProofResult>>(
        `${this.apiUrl}/student/transactions/${id}/upload-proof`,
        formData
      )
      .pipe(
        map(res => res.data),
        catchError(this.handleError)
      );
  }

  /**
   * POST /api/student/transactions
   * Membuat transaksi baru (checkout) untuk course tertentu.
   */
  createTransaction(courseId: number): Observable<Transaction> {
    return this.http
      .post<ApiResponse<Transaction>>(`${this.apiUrl}/student/transactions`, { course_id: courseId })
      .pipe(
        map(res => res.data),
        catchError(this.handleError)
      );
  }

  // ── Helper ─────────────────────────────────────────────────

  /** Resolve URL gambar bukti dari path relatif storage */
  resolveProofUrl(path: string | null): string | null {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = this.apiUrl.replace('/api', '');
    return `${base}/storage/${path.replace(/^\//, '')}`;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let msg = 'Terjadi kesalahan pada sistem.';
    if (error.error?.message) {
      msg = error.error.message;
    } else if (error.error instanceof ErrorEvent) {
      msg = error.error.message;
    } else {
      msg = `Error ${error.status}: ${error.message}`;
    }
    console.error('[TransactionService]', error);
    return throwError(() => new Error(msg));
  }
}
