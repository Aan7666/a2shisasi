import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { QuizService } from '../services/quiz.service';
import { Quiz, QuizQuestion, QuizAnswer } from '../models/index';

@Component({
  selector: 'app-quiz-attempt',
  templateUrl: './quiz-attempt.page.html',
  styleUrls: ['./quiz-attempt.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class QuizAttemptPage implements OnInit, OnDestroy {
  quizId: number = 0;
  courseId: number = 0;

  // Page States: 'loading' | 'error' | 'intro' | 'playing' | 'submitting' | 'result'
  state: 'loading' | 'error' | 'intro' | 'playing' | 'submitting' | 'result' = 'loading';
  errorMessage: string = '';

  quiz: Quiz | null = null;
  questions: QuizQuestion[] = [];
  currentIndex: number = 0;

  // User's selections: { [questionId: number]: optionId }
  userAnswers: { [questionId: number]: number } = {};

  // Timer properties
  timeLeftSeconds: number = 0;
  timerInterval: any = null;

  // Attempt Result properties
  quizResult: {
    score: number;
    isPassed: boolean;
    certificateGenerated: boolean;
    totalQuestions?: number;
    correctAnswersCount?: number;
  } | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.quizId = Number(params['id']) || 0;
      this.route.queryParams.subscribe(qParams => {
        this.courseId = Number(qParams['course_id']) || 0;
        if (this.quizId) {
          this.loadQuiz();
        } else {
          this.state = 'error';
          this.errorMessage = 'ID Kuis tidak valid.';
        }
      });
    });
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  loadQuiz() {
    this.state = 'loading';
    this.quizService.getQuiz(this.quizId).subscribe({
      next: (data) => {
        this.quiz = data;
        this.questions = data.questions || [];
        
        // If they already completed it or cannot attempt, check result
        if (!this.getCanAttempt() && (data.isAttempted || data.score !== undefined)) {
          this.loadPreviousResult();
        } else {
          this.state = 'intro';
        }
      },
      error: (err) => {
        console.error('Failed to load quiz:', err);
        this.state = 'error';
        this.errorMessage = err.message || 'Gagal memuat detail kuis.';
      }
    });
  }

  loadPreviousResult() {
    this.state = 'loading';
    this.quizService.getResult(this.quizId).subscribe({
      next: (res) => {
        this.quizResult = {
          score: res.score ?? 0,
          isPassed: res.is_passed ?? res.isPassed ?? false,
          certificateGenerated: res.certificate_generated ?? false,
          totalQuestions: res.total_questions,
          correctAnswersCount: res.correct_answers_count
        };
        this.state = 'result';
      },
      error: (err) => {
        // If getResult fails, we can fall back to info on the quiz object
        console.warn('Failed to load previous result, falling back:', err);
        this.quizResult = {
          score: this.quiz?.score ?? 0,
          isPassed: this.quiz?.isPassed ?? false,
          certificateGenerated: false
        };
        this.state = 'result';
      }
    });
  }

  getCanAttempt(): boolean {
    if (!this.quiz) return false;
    if (typeof this.quiz.can_attempt === 'boolean') {
      return this.quiz.can_attempt;
    }
    if (this.quiz.can_attempt && typeof this.quiz.can_attempt === 'object') {
      return !!this.quiz.can_attempt.allowed;
    }
    return true;
  }

  getCanAttemptMessage(): string {
    if (!this.quiz || !this.quiz.can_attempt) return '';
    if (typeof this.quiz.can_attempt === 'object') {
      const canAttempt = this.quiz.can_attempt;
      if (canAttempt.allowed) return '';

      const reason = canAttempt.reason;
      if (reason === 'already_passed') {
        return 'Kamu sudah lulus kuis ini.';
      }
      if (reason === 'cooldown') {
        return 'Kamu harus menunggu sebelum mencoba lagi.';
      }
      if (reason === 'max_attempts') {
        return 'Kamu telah mencapai batas maksimal pengerjaan kuis ini.';
      }
      if (canAttempt.message) {
        return canAttempt.message;
      }
    }
    return 'Kamu telah mencapai batas maksimal pengerjaan atau telah menyelesaikan kuis ini.';
  }

  startQuiz() {
    if (!this.getCanAttempt()) {
      this.showToast(this.getCanAttemptMessage());
      return;
    }

    if (this.questions.length === 0) {
      this.showToast('Kuis ini tidak memiliki pertanyaan.');
      return;
    }

    this.state = 'playing';
    this.currentIndex = 0;
    this.userAnswers = {};

    // Setup timer if time_limit is defined (in minutes)
    if (this.quiz?.time_limit && this.quiz.time_limit > 0) {
      this.timeLeftSeconds = this.quiz.time_limit * 60;
      this.startTimer();
    }
  }

  startTimer() {
    this.clearTimer();
    this.timerInterval = setInterval(() => {
      this.timeLeftSeconds--;
      if (this.timeLeftSeconds <= 0) {
        this.clearTimer();
        this.showToast('Waktu pengerjaan telah habis! Mengumpulkan kuis...');
        this.submitAnswers(true);
      }
    }, 1000);
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  getFormattedTime(): string {
    const minutes = Math.floor(this.timeLeftSeconds / 60);
    const seconds = this.timeLeftSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  selectOption(questionId: number, optionId: number) {
    this.userAnswers[questionId] = optionId;
  }

  isOptionSelected(questionId: number, optionId: number): boolean {
    return this.userAnswers[questionId] === optionId;
  }

  get activeQuestion(): QuizQuestion | null {
    return this.questions[this.currentIndex] || null;
  }

  prevQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
    }
  }

  goToQuestion(index: number) {
    if (index >= 0 && index < this.questions.length) {
      this.currentIndex = index;
    }
  }

  isQuestionAnswered(questionId: number): boolean {
    return this.userAnswers[questionId] !== undefined;
  }

  async confirmSubmit() {
    const unansweredCount = this.questions.filter(q => !this.isQuestionAnswered(q.id)).length;
    
    let message = 'Apakah kamu yakin ingin menyelesaikan kuis ini?';
    if (unansweredCount > 0) {
      message = `Ada ${unansweredCount} pertanyaan yang belum dijawab. Apakah kamu tetap ingin menyelesaikan kuis ini?`;
    }

    const alert = await this.alertController.create({
      header: 'Konfirmasi Selesai',
      message: message,
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Kumpulkan',
          handler: () => {
            this.submitAnswers();
          }
        }
      ]
    });

    await alert.present();
  }

  submitAnswers(force: boolean = false) {
    this.clearTimer();
    this.state = 'submitting';

    const answersArray: QuizAnswer[] = Object.keys(this.userAnswers).map(qId => ({
      questionId: Number(qId),
      optionId: this.userAnswers[Number(qId)]
    }));

    // If force submit (timer expired) and some questions have no answers, we still submit empty/missing ones
    if (force) {
      this.questions.forEach(q => {
        if (this.userAnswers[q.id] === undefined) {
          // Do not add to answersArray or backend will grade only the sent answers
        }
      });
    }

    this.quizService.submitQuiz(this.quizId, answersArray).subscribe({
      next: (res) => {
        this.quizResult = {
          score: res.score ?? 0,
          isPassed: res.is_passed ?? res.isPassed ?? false,
          certificateGenerated: res.certificate_generated ?? false,
          totalQuestions: res.total_questions,
          correctAnswersCount: res.correct_answers_count
        };
        this.state = 'result';
        
        // Refresh the quiz cache or object to reflect new state
        if (this.quiz) {
          this.quiz.isAttempted = true;
          this.quiz.score = res.score;
          this.quiz.isPassed = res.is_passed;
        }
      },
      error: (err) => {
        console.error('Failed to submit quiz:', err);
        this.showToast('Gagal mengirimkan kuis: ' + (err.message || 'Terjadi kesalahan.'));
        this.state = 'playing';
        if (this.quiz?.time_limit && this.quiz.time_limit > 0) {
          this.startTimer();
        }
      }
    });
  }

  retryQuiz() {
    this.state = 'intro';
    this.loadQuiz();
  }

  goBack() {
    if (this.state === 'playing') {
      this.alertController.create({
        header: 'Keluar Kuis?',
        message: 'Jawaban yang sudah kamu pilih akan hilang jika kamu keluar halaman kuis sekarang. Tetap keluar?',
        buttons: [
          {
            text: 'Batal',
            role: 'cancel'
          },
          {
            text: 'Keluar',
            handler: () => {
              this.clearTimer();
              window.history.back();
            }
          }
        ]
      }).then(alert => alert.present());
    } else {
      window.history.back();
    }
  }

  async showToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 3000,
      color: 'dark',
      position: 'bottom'
    });
    await toast.present();
  }
}
