import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Instructor {
  id: number;
  name: string;
  avatar?: string;
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  type: string;
  duration: string;
  order: number;
}

export interface Course {
  id: number;
  title: string;
  instructor?: Instructor;
  price: number;
  status: string;
  thumbnail?: string;
  image?: string;
  cover_image?: string;
  cover?: string;
  image_path?: string;
  thumbnail_path?: string;
  image_url?: string;
  description?: string;
  lessons?: Lesson[];
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // GET /api/courses
  getCourses(): Observable<Course[]> {
    return this.http.get<any>(`${this.apiUrl}/courses`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          return response.data;
        }
        if (response && response.data) {
          return response.data;
        }
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      })
    );
  }

  // GET /api/courses/{id}
  getCourseDetail(id: number): Observable<Course | null> {
    return this.http.get<any>(`${this.apiUrl}/courses/${id}`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          return response.data;
        }
        if (response && response.data) {
          return response.data;
        }
        return response || null;
      })
    );
  }

  // GET /api/courses/{id}/check-access
  checkAccess(id: number): Observable<boolean> {
    return this.http.get<any>(`${this.apiUrl}/courses/${id}/check-access`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          return response.data.hasAccess;
        }
        if (response && response.data) {
          return response.data.hasAccess;
        }
        return false;
      })
    );
  }
}
