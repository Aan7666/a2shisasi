import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CourseService, Lesson, LessonDetail } from '../services/course.service';
import { ProgressService } from '../services/progress.service';

@Component({
  selector: 'app-video-materi',
  templateUrl: './video-materi.page.html',
  styleUrls: ['./video-materi.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, TitleCasePipe]
})
export class VideoMateriPage implements OnInit, OnDestroy {

  // ── Params from route ──
  courseId: number = 0;
  lessonId: number = 0;

  // ── State ──
  lessons: Lesson[] = [];
  activeLesson: LessonDetail | null = null;
  isLoadingList: boolean = true;
  isLoadingLesson: boolean = false;
  hasError: boolean = false;

  // ── Video playback ──
  isPlaying: boolean = false;
  currentTime: number = 0;
  videoInterval: any = null;
  videoProgress: number = 0;

  // ── Completion ──
  markingComplete: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private progressService: ProgressService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.courseId = Number(params['course_id']) || 0;
      this.lessonId = Number(params['lesson_id']) || 0;

      if (!this.courseId) {
        this.hasError = true;
        this.isLoadingList = false;
        return;
      }
      this.loadLessons();
    });
  }

  ngOnDestroy() {
    this.clearVideoInterval();
  }

  // ── Load lesson list ──────────────────────────────────────
  loadLessons() {
    this.isLoadingList = true;
    this.courseService.getLessons(this.courseId).subscribe({
      next: (data) => {
        this.lessons = data;
        this.isLoadingList = false;

        // Pick which lesson to open
        const target = this.lessonId
          ? data.find(l => l.id === this.lessonId)
          : data[0];

        if (target) {
          this.openLesson(target.id);
        }
      },
      error: (err) => {
        console.error('Gagal memuat lessons', err);
        this.hasError = true;
        this.isLoadingList = false;
      }
    });
  }

  // ── Open a specific lesson ────────────────────────────────
  openLesson(lessonId: number) {
    this.clearVideoInterval();
    this.isPlaying = false;
    this.currentTime = 0;
    this.videoProgress = 0;
    this.isLoadingLesson = true;
    this.lessonId = lessonId;

    this.courseService.getLessonDetail(this.courseId, lessonId).subscribe({
      next: (data) => {
        this.activeLesson = data;
        this.isLoadingLesson = false;
      },
      error: (err) => {
        console.error('Gagal memuat detail lesson', err);
        this.isLoadingLesson = false;
        this.showToast('Gagal memuat materi. Coba lagi.');
      }
    });
  }

  // ── Video controls ────────────────────────────────────────
  togglePlay() {
    if (!this.activeLesson || this.activeLesson.type !== 'video') return;

    if (this.isPlaying) {
      this.clearVideoInterval();
      this.isPlaying = false;
    } else {
      this.isPlaying = true;
      const totalSec = this.parseDurationToSeconds(this.activeLesson.duration_or_pages);
      this.videoInterval = setInterval(() => {
        if (this.currentTime < totalSec) {
          this.currentTime += 1;
          this.videoProgress = totalSec > 0 ? (this.currentTime / totalSec) * 100 : 0;
        } else {
          this.clearVideoInterval();
          this.isPlaying = false;
          this.currentTime = 0;
          this.videoProgress = 0;
          this.showToast('Video selesai! Tandai sebagai selesai?');
          this.markLessonComplete();
        }
      }, 1000);
    }
  }

  clearVideoInterval() {
    if (this.videoInterval) {
      clearInterval(this.videoInterval);
      this.videoInterval = null;
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /** Parses "08:30" or "510" or "8 mnt" to total seconds */
  parseDurationToSeconds(dur: string | undefined): number {
    if (!dur) return 0;
    const mmss = dur.match(/^(\d+):(\d+)$/);
    if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);
    const mins = dur.match(/(\d+)\s*mnt/i);
    if (mins) return Number(mins[1]) * 60;
    const num = parseInt(dur, 10);
    return isNaN(num) ? 0 : num;
  }

  // ── Mark lesson complete ──────────────────────────────────
  markLessonComplete() {
    if (!this.activeLesson || this.activeLesson.is_completed || this.markingComplete) return;
    this.markingComplete = true;

    this.progressService.markComplete(this.courseId, this.activeLesson.id).subscribe({
      next: () => {
        if (this.activeLesson) this.activeLesson.is_completed = true;
        // Update is_completed in the sidebar list too
        const found = this.lessons.find(l => l.id === this.activeLesson?.id);
        if (found) found.is_completed = true;
        this.markingComplete = false;
        this.showToast('Pelajaran selesai! ✅');
      },
      error: () => { this.markingComplete = false; }
    });
  }

  // ── Navigation ────────────────────────────────────────────
  goToNextLesson() {
    if (!this.activeLesson?.next_lesson_id) {
      this.showToast('Selamat! Kamu telah menyelesaikan semua materi. 🎉');
      return;
    }
    this.openLesson(this.activeLesson.next_lesson_id);
  }

  goToPrevLesson() {
    if (!this.activeLesson?.prev_lesson_id) return;
    this.openLesson(this.activeLesson.prev_lesson_id);
  }

  isActiveLessonInList(lesson: Lesson): boolean {
    return lesson.id === this.activeLesson?.id;
  }

  goBack() {
    this.router.navigate(['/detail-course', this.courseId]);
  }

  async showToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2500,
      color: 'dark',
      position: 'bottom'
    });
    await toast.present();
  }
}
