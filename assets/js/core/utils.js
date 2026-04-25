import { UI_CONFIG, CAMERA_CONFIG, TENSORFLOW_CONFIG } from './config.js';

export const isMobileDevice = () => {
  return (
    navigator.userAgentData?.mobile ??
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
};

export const getCameraConfig = () => {
  const mobile = isMobileDevice();
  return {
    defaultFPS: CAMERA_CONFIG.defaultFPS,
    fpsRange: CAMERA_CONFIG.fpsRange,
    resolution: mobile
      ? CAMERA_CONFIG.mobileResolution
      : CAMERA_CONFIG.desktopResolution,
    facingMode: mobile
      ? CAMERA_CONFIG.mobileFacingMode
      : CAMERA_CONFIG.desktopFacingMode,
  };
};

export const createDelay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const isValidDetection = (result) => {
  const { confidenceThresholds } = TENSORFLOW_CONFIG;
  return result && result.confidence >= confidenceThresholds.excellent;
};

export const validateModelMetadata = (metadata) => {
  return metadata && metadata.labels && Array.isArray(metadata.labels);
};

export const getConfidenceTheme = (confidence) => {
  const { excellent, good } = TENSORFLOW_CONFIG.confidenceThresholds;
  if (confidence >= excellent) return 'green';
  if (confidence >= good) return 'yellow';
  return 'red';
};

export const getConfidenceTextClass = (confidence) => {
  const theme = getConfidenceTheme(confidence);
  return `text-${theme}`;
};

export const getConfidenceCardClass = (confidence) => {
  const theme = getConfidenceTheme(confidence);
  return `theme-${theme}`;
};

export const getCameraConstraints = (selectedCameraId) => {
  const config = getCameraConfig();
  return {
    video: {
      deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
      width: { ideal: config.resolution.width },
      height: { ideal: config.resolution.height },
      facingMode: config.facingMode,
      frameRate: { ideal: config.defaultFPS },
    },
  };
};

export const getCameraErrorMessage = (error) => {
  if (error.name === 'NotAllowedError') {
    return 'Izin kamera ditolak. Harap izinkan akses kamera.';
  } else if (error.name === 'NotFoundError') {
    return 'Tidak ada kamera ditemukan pada perangkat ini.';
  } else if (error.name === 'NotReadableError') {
    return 'Kamera sedang digunakan oleh aplikasi lain.';
  }
  return 'Gagal memulai kamera';
};

export const addFadeInAnimation = (element) => {
  if (!element) return;

  const { fadeAnimation } = UI_CONFIG;
  element.style.animation = 'none';
  void element.offsetWidth; // trigger reflow
  element.style.animation = fadeAnimation;
};

export const addScaleAnimation = (element, callback) => {
  if (!element) return;

  const { animationDuration } = UI_CONFIG;
  element.style.transform = 'scale(1.02)';
  element.style.transition = `transform ${animationDuration}ms ease`;

  setTimeout(() => {
    if (element) {
      element.style.transform = 'scale(1)';
    }
    if (callback) {
      callback();
    }
  }, animationDuration);
};

export const isWebGPUSupported = () => {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
};

export const updatePerformanceStats = (stats, operationTime) => {
  stats.operations++;
  stats.totalTime += operationTime;
  stats.averageTime = stats.totalTime / stats.operations;
  return stats;
};

export const logPerformance = (type, backend, operationTime, averageTime) => {
  console.log(
    `⚡ ${type} - ${backend?.toUpperCase()}: ${Math.round(operationTime)}ms (avg: ${Math.round(averageTime)}ms)`,
  );
};

export const createPerformanceResult = (
  operationTime,
  backend,
  averageTime,
  totalOperations,
) => ({
  operationTime: Math.round(operationTime),
  backend: backend,
  averageTime: Math.round(averageTime),
  totalOperations: totalOperations,
});

export const hideElement = (element) => {
  if (element) element.classList.add('hidden');
};

export const showElement = (element) => {
  if (element) element.classList.remove('hidden');
};

export const setElementOpacity = (element, opacity) => {
  if (element) element.style.opacity = opacity;
};

export const setElementText = (element, text) => {
  if (element) element.textContent = text;
};

export const setElementHTML = (element, html) => {
  if (element) element.innerHTML = html;
};

export const logError = (context, error) => {
  console.error(`❌ ${context}:`, error);
};

/**
 * Membuat callback untuk melacak progress download model.
 * Menghitung progress encoder dan decoder secara terpisah.
 * Menggunakan throttling untuk menghindari terlalu banyak pemanggilan callback.
 */
export const createModelProgressCallback = (onProgress, throttleMs = 200) => {
  const fileProgress = {};
  let lastMessage = '';
  let lastCallTime = 0;

  return (progress) => {
    // Abaikan jika bukan event progress atau tidak ada file
    if (progress.status !== 'progress' || !progress.file) return;

    // Filter hanya file encoder dan decoder
    const isEncoder = progress.file.includes('encoder');
    const isDecoder = progress.file.includes('decoder');
    if (!isEncoder && !isDecoder) return;

    // Update progress untuk file ini
    fileProgress[progress.file] = Math.round(progress.progress);

    // Hitung rata-rata progress untuk encoder dan decoder
    const encoderFiles = Object.entries(fileProgress).filter(([file]) =>
      file.includes('encoder'),
    );
    const decoderFiles = Object.entries(fileProgress).filter(([file]) =>
      file.includes('decoder'),
    );

    const average = (entries) => {
      if (entries.length === 0) return 0;
      const sum = entries.reduce((acc, [, val]) => acc + val, 0);
      return Math.round(sum / entries.length);
    };

    const encoder = average(encoderFiles);
    const decoder = average(decoderFiles);
    const message = `Mengunduh model AI... Encoder: ${encoder}% | Decoder: ${decoder}%`;

    // Throttling: hanya panggil callback jika ada perubahan dan interval terpenuhi
    if (message === lastMessage) return;

    const now = Date.now();
    if (now - lastCallTime < throttleMs) return;
    lastCallTime = now;
    lastMessage = message;

    if (onProgress && typeof onProgress === 'function') {
      onProgress({ status: 'downloading', encoder, decoder, message });
    }
  };
};
