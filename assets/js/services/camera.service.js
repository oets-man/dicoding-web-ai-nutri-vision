import {
  getCameraConfig,
  getCameraConstraints,
  getCameraErrorMessage,
  logError,
} from '../core/utils.js';

class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.config = getCameraConfig();

    this.initializeElements();
    this.init();
  }

  initializeElements() {
    this.video = document.getElementById('videoElement');
    this.canvas = document.getElementById('canvasElement');
    this.cameraSelect = document.getElementById('camera-select');
  }

  async init() {
    await this.loadCameras();
  }

  async loadCameras() {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === 'videoinput');

      if (cameras.length === 0) {
        logError(
          'Tidak ada kamera ditemukan',
          new Error('Tidak ada perangkat input video yang tersedia'),
        );
        return;
      }

      if (this.cameraSelect) {
        this.cameraSelect.innerHTML = '';
        cameras.forEach((camera, index) => {
          const option = document.createElement('option');
          option.value = camera.deviceId;
          option.textContent = camera.label || `Camera ${index + 1}`;
          this.cameraSelect.appendChild(option);
        });
      }
    } catch (error) {
      logError('Gagal memuat kamera', error);
      throw new Error(`Akses kamera gagal: ${error.message}`);
    }
  }

  async startCamera() {
    try {
      this.stopCamera();

      const selectedCameraId = this.cameraSelect
        ? this.cameraSelect.value
        : undefined;
      const constraints = getCameraConstraints(selectedCameraId);

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.video) {
        this.video.srcObject = this.stream;
        await this.video.play();
      }

      return true;
    } catch (error) {
      logError('Gagal memulai kamera', error);
      const errorMessage = getCameraErrorMessage(error);
      throw new Error(errorMessage);
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;

      if (this.video) {
        this.video.srcObject = null;
      }
    }
  }

  setFPS(fps) {
    const { fpsRange } = this.config;
    if (fps < fpsRange.min || fps > fpsRange.max) {
      logError(
        'FPS tidak valid',
        new Error(`FPS harus antara ${fpsRange.min} dan ${fpsRange.max}`),
      );
      return;
    }

    this.config.defaultFPS = fps;
  }

  isActive() {
    return this.stream && this.stream.active;
  }

  isReady() {
    return (
      this.isActive() &&
      this.video &&
      this.video.readyState >= 2 &&
      !this.video.paused
    );
  }

  captureFrame() {
    if (!this.isReady() || !this.canvas) {
      return null;
    }

    const ctx = this.canvas.getContext('2d');
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    ctx.drawImage(this.video, 0, 0);

    return this.canvas;
  }
}

export default CameraService;
