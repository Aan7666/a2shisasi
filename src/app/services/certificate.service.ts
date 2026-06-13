import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse, Certificate } from '../models/index';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * GET /student/certificates
   * Returns: Certificate[]
   */
  getMyCertificates(): Observable<Certificate[]> {
    return this.http.get<ApiResponse<Certificate[]>>(`${this.apiUrl}/student/certificates`).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * GET /student/certificates/:id
   * Returns: Certificate
   */
  getCertificate(id: number): Observable<Certificate> {
    return this.http.get<ApiResponse<Certificate>>(`${this.apiUrl}/student/certificates/${id}`).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * GET /student/certificates/:id/download
   * Returns: string (URL file download yang ditambahkan token auth untuk auth tab baru)
   */
  getDownloadUrl(id: number): string {
    const token = localStorage.getItem('token') || localStorage.getItem('a2shi_token');
    const tokenQuery = token ? `?token=${token}` : '';
    return `${this.apiUrl}/student/certificates/${id}/download${tokenQuery}`;
  }

  /**
   * GET /admin/certificates
   * Returns: any
   */
  adminGetAll(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/admin/certificates`).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Terjadi kesalahan sistem.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}

/*
=== CONTOH CARA PEMAKAIAN DI KOMPONEN ===
import { Component, OnInit } from '@angular/core';
import { CertificateService } from '../../services/certificate.service';
import { Certificate } from '../../models';

@Component({
  selector: 'app-certificates',
  template: '...'
})
export class CertificatesComponent implements OnInit {
  certificates: Certificate[] = [];

  constructor(private certificateService: CertificateService) {}

  ngOnInit() {
    this.certificateService.getMyCertificates().subscribe({
      next: (certificates) => {
        this.certificates = certificates;
      }
    });
  }

  downloadCertificate(certId: number) {
    const downloadUrl = this.certificateService.getDownloadUrl(certId);
    window.open(downloadUrl, '_blank'); // Buka link download sertifikat di tab baru
  }
}
*/
