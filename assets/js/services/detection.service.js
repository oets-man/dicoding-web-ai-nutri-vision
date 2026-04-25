import { PERFORMANCE_CONFIG, TENSORFLOW_CONFIG } from '../core/config.js';
import {
  validateModelMetadata,
  logError,
  updatePerformanceStats,
  createPerformanceResult,
  logPerformance,
} from '../core/utils.js';

class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
    this.config = TENSORFLOW_CONFIG;
    this.performanceStats = PERFORMANCE_CONFIG;
  }

  /**
   * TODO:
   * Konfigurasi backend TensorFlow.js:
   * [] Cek ketersediaan WebGPU.
   * [] Set backend yang optimal.
   */
  async loadModel() {
    try {
      await tf.ready();

      const [metadata, model] = await Promise.all([
        fetch(this.config.metadataPath).then((r) => r.json()),
        tf.loadLayersModel(this.config.modelPath),
      ]);

      if (!validateModelMetadata(metadata)) {
        throw new Error('Metadata tidak valid: array label tidak ditemukan');
      }

      this.labels = metadata.labels;
      this.model = model;

      return {
        success: true,
        labels: this.labels,
        modelName: metadata.modelName || 'Unknown',
        version: metadata.version || '1.0.0',
      };
    } catch (error) {
      logError('Gagal memuat model', error);
      throw new Error(`Gagal memuat model: ${error.message}`);
    }
  }

  async predict(imageElement) {
    if (!this.model) {
      throw new Error(
        'Model belum dimuat. Panggil loadModel() terlebih dahulu.',
      );
    }

    if (!imageElement) {
      throw new Error('Elemen gambar diperlukan untuk prediksi');
    }

    let tensor = null;
    let predictions = null;
    const startTime = performance.now();

    try {
      tensor = tf.tidy(() => {
        return tf.browser
          .fromPixels(imageElement)
          .resizeBilinear(this.config.inputSize)
          .div(this.config.normalizationFactor)
          .expandDims(0);
      });

      predictions = this.model.predict(tensor);
      const values = await predictions.data();

      const endTime = performance.now();
      const predictionTime = endTime - startTime;

      updatePerformanceStats(this.performanceStats, predictionTime);

      const maxIndex = values.indexOf(Math.max(...values));
      const confidence = Math.round(values[maxIndex] * 100);
      const className = this.labels[maxIndex];
      const isValid = confidence >= this.config.confidenceThreshold * 100;
      const backendName = tf.getBackend();

      const result = {
        className: className,
        confidence: confidence,
        isValid: isValid,
        performance: createPerformanceResult(
          predictionTime,
          backendName,
          this.performanceStats.averageTime,
          this.performanceStats.operations,
        ),
      };

      logPerformance(
        'Detection',
        backendName,
        predictionTime,
        this.performanceStats.averageTime,
      );

      return result;
    } catch (error) {
      logError('Kesalahan prediksi', error);
      throw new Error(`Prediksi gagal: ${error.message}`);
    } finally {
      if (tensor) tensor.dispose();
      if (predictions) predictions.dispose();
    }
  }

  isLoaded() {
    return !!this.model && this.labels.length > 0;
  }
}

export default DetectionService;
