import CameraService from '../services/camera.service.js';
import DetectionService from '../services/detection.service.js';
import UIHandler from '../ui/ui.handler.js';
import { APP_CONFIG } from './config.js';
import { createDelay, isValidDetection, logError } from './utils.js';

class NutriApp {
  constructor() {
    this.detector = null;
    this.camera = null;
    this.generator = null;
    this.ui = new UIHandler();
    this.isRunning = false;
    this.currentLoopId = null;
    this.config = APP_CONFIG;

    this.ui.disableButton('Memuat Model AI...');

    this.bindEvents();
    this.init();
  }

  bindEvents() {
    this.ui.bindEvents({
      onToggleCamera: () => this.toggleCamera(),
      onFPSChange: (fps) => {
        if (this.camera) {
          this.camera.setFPS(fps);
        }
      },
      onCameraChange: () => {
        if (this.camera && this.camera.isActive()) {
          this.camera.startCamera();
        }
      },
    });
  }

  /**
   * TODO:
   * Lengkapi fungsi init untuk menginisialisasi kemampuan aplikasi:
   * [] Kemampuan deteksi (DetectionService)
   * [] Kamera (CameraService)
   * [] Kemampuan generatif (NutritionService)
   */
  async init() {
    try {
      this.ui.showStatus('Memuat Model AI...');

      this.detector = new DetectionService();
      await this.detector.loadModel();

      this.camera = new CameraService();

      this.ui.showStatus('Model AI Siap');
      this.ui.enableButton();
    } catch (error) {
      logError('Gagal menginisialisasi aplikasi', error);
      this.ui.showStatus('Model gagal dimuat');
      this.ui.showError(`Gagal menginisialisasi: ${error.message}`);
      this.ui.disableButton('Model Gagal Dimuat');
    }
  }

  /**
   * TODO:
   * [] Register Service Worker agar aplikasi dapat diakses secara offline.
   * [] Konfigurasi file sw.js untuk caching aset-aset penting aplikasi.
   */

  toggleCamera() {
    if (!this.detector || !this.detector.isLoaded()) {
      this.ui.showError(
        'Model deteksi AI belum siap. Harap tunggu inisialisasi selesai.',
      );
      return;
    }

    if (!this.isRunning) {
      this.startCamera();
    } else {
      this.stopCamera();
    }
  }

  async startCamera() {
    try {
      this.ui.updateCameraUI(true);

      if (this.camera) {
        await this.camera.startCamera();
        this.startDetection();
      } else {
        throw new Error('Modul kamera tidak terinisialisasi');
      }
    } catch (error) {
      logError('Gagal memulai kamera', error);
      this.ui.updateCameraUI(false);
      this.ui.showError(error.message);
    }
  }

  stopCamera() {
    this.isRunning = false;
    this.stopDetection();

    if (this.camera) {
      this.camera.stopCamera();
    }

    this.ui.updateCameraUI(false, true);
  }

  startDetection() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.currentLoopId = Date.now() + Math.random();
    this.detectLoop(this.currentLoopId);
  }

  stopDetection() {
    this.isRunning = false;
    this.currentLoopId = null;
  }

  /**
   * TODO:
   * Tambahkan logika utama untuk proses deteksi dan generatif di dalam detectLoop.
   * [] Deteksi objek menggunakan this.detector.predict().
   * [] Jika deteksi valid menggunakan isValidDetection(), lalu hentikan loop deteksi.
   * [] Panggil method this.generateAndShowResults() untuk menampilkan hasil deteksi dan generasi nutrisi.
   */
  async detectLoop(loopId) {
    if (!this.isRunning || this.currentLoopId !== loopId) {
      return;
    }

    if (!this.camera.isReady() || !this.detector.isLoaded()) {
      if (this.isRunning && this.currentLoopId === loopId) {
        setTimeout(
          () => this.detectLoop(loopId),
          this.config.detectionRetryInterval,
        );
      }
      return;
    }

    try {
      const canvas = this.camera.captureFrame();
      if (!canvas) {
        if (this.isRunning && this.currentLoopId === loopId) {
          requestAnimationFrame(() => this.detectLoop(loopId));
        }
        return;
      }

      const result = await this.detector.predict(canvas);
      console.log('Deteksi hasil:', result);
      if (isValidDetection(result)) {
        this.stopDetection();
        this.ui.switchToState('result');
      }
    } catch (error) {
      logError('Deteksi error', error);
    }

    if (this.isRunning && this.currentLoopId === loopId) {
      requestAnimationFrame(() => this.detectLoop(loopId));
    }
  }

  /**
   * TODO:
   * [] Panggil method this.generator.generateNutrition() pada detection.service.js.
   * [] Kirimkan hasil deteksi (detectionResult.className) sebagai parameter.
   * [] Tampilkan hasil generasi nutrisi pada UI menggunakan this.ui.updateNutritionState().
   * [] Tangani error jika proses generasi gagal.
   */
  async generateAndShowResults(detectionResult) {
    try {
      this.ui.showResults(detectionResult, null);

      this.isRunning = false;
      this.stopDetection();

      if (this.camera) {
        this.camera.stopCamera();
      }

      this.ui.updateCameraUI(false, true);

      if (this.generator && this.generator.isReady()) {
        await createDelay(this.config.nutritionGenerationDelay);
        this.ui.updateNutritionState('loading');
      } else {
        this.ui.updateNutritionState('error');
      }
    } catch (error) {
      logError('Gagal menampilkan hasil', error);
      this.ui.updateNutritionState('error');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new NutriApp();

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

export default NutriApp;
