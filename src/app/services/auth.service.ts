import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CourseService } from './course.service';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  bio?: string;
  avatar?: string;
  google_id?: string;
  last_login_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'a2shi_token';
  private readonly USER_KEY = 'a2shi_user';
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private courseService: CourseService) { }

  // ── LOGIN ─────────────────────────────────────────────────
  // POST /api/auth/login
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

  // POST /api/auth/register/complete-google
  completeGoogleRegister(data: {
    email: string;
    name: string;
    password: string;
    password_confirmation: string;
    google_id: string;
    avatar?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register/complete-google`, data).pipe(
      tap(response => {
        if (response?.data?.token) {
          localStorage.setItem(this.TOKEN_KEY, response.data.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.data.user));
        }
      })
    );
  }

  // ── FORGOT PASSWORD ───────────────────────────────────────
  // POST /api/auth/forgot-password
  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  // POST /api/auth/forgot-password/verify-otp
  verifyForgotOtp(email: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/forgot-password/verify-otp`, { email, code });
  }

  // POST /api/auth/reset-password
  resetPassword(email: string, password: string, password_confirmation: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/reset-password`, { email, password, password_confirmation });
  }

  // ── REGISTER ──────────────────────────────────────────────
  // POST /api/auth/register/send-otp
  sendOtp(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register/send-otp`, { email });
  }

  // POST /api/auth/register/verify-otp
  verifyOtp(email: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register/verify-otp`, { email, code });
  }

  // POST /api/auth/register/complete
  completeRegister(data: { email: string; name: string; password: string; password_confirmation: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register/complete`, data).pipe(
      tap(response => {
        if (response?.data?.token) {
          localStorage.setItem(this.TOKEN_KEY, response.data.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.data.user));
        }
      })
    );
  }

  // ── LOGOUT ───────────────────────────────────────────────
  // POST /api/auth/logout
  logout(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => this.clearSession())
    );
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem(this.USER_KEY);
    this.courseService.clearCache();
  }

  // ── PROFILE ──────────────────────────────────────────────
  // GET /api/auth/me
  getMe(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/me`).pipe(
      tap(response => {
        if (response?.data) {
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.data));
        }
      })
    );
  }

  // PUT /api/auth/profile
  updateProfile(data: { name?: string; bio?: string; avatar?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/auth/profile`, data).pipe(
      tap(response => {
        if (response?.data) {
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.data));
        } else {
          // Update lokal jika backend tidak mengembalikan data user
          const currentUser = this.getCurrentUser();
          if (currentUser) {
            Object.assign(currentUser, data);
            localStorage.setItem(this.USER_KEY, JSON.stringify(currentUser));
          }
        }
      })
    );
  }

  // PUT /api/auth/password
  changePassword(current_password: string, new_password: string, new_password_confirmation: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/auth/password`, {
      current_password,
      new_password,
      new_password_confirmation
    });
  }

  // ── LEGACY (tetap ada untuk kompatibilitas) ───────────────
  // Gunakan updateProfile() sebagai gantinya
  updateName(name: string): Observable<any> {
    return this.updateProfile({ name });
  }

  deleteAccount(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/user/profile`).pipe(
      tap(() => this.clearSession())
    );
  }

  // ── HELPER ───────────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}