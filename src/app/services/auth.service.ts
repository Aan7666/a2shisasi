import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'a2shi_token';
  private readonly USER_KEY = 'a2shi_user';
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // ── LOGIN ─────────────────────────────────────────────────
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => {
        if (response?.data?.token) {
          localStorage.setItem(this.TOKEN_KEY, response.data.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.data.user));
        }
      })
    );
  }

  // ── GOOGLE LOGIN ──────────────────────────────────────────
  getGoogleAuthUrl(): Promise<any> {
    return fetch(`${this.apiUrl}/auth/google?source=mobile`, {
      headers: { 'Accept': 'application/json' }
    }).then(r => r.json());
  }

  // ── FORGOT PASSWORD ───────────────────────────────────────
  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  verifyForgotOtp(email: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/forgot-password/verify-otp`, { email, code });
  }

  resetPassword(email: string, password: string, password_confirmation: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/reset-password`, { email, password, password_confirmation });
  }

  // ── REGISTER ──────────────────────────────────────────────
  sendOtp(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register/send-otp`, { email });
  }

  verifyOtp(email: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register/verify-otp`, { email, code });
  }

  completeRegister(data: { email: string; name: string; password: string; password_confirmation: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register/complete`, data);
  }

  // ── LOGOUT ───────────────────────────────────────────────
  logout(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => this.clearSession())
    );
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // ── HELPER ───────────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}