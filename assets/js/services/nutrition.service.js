import { PERFORMANCE_CONFIG, TRANSFORMERS_CONFIG } from '../core/config.js';
import {
  createDelay,
  createModelProgressCallback,
  createPerformanceResult,
  logError,
  logPerformance,
  updatePerformanceStats,
} from '../core/utils.js';

class NutritionService {
  constructor(ui = null) {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.config = TRANSFORMERS_CONFIG;
    this.currentBackend = null;
    this.performanceStats = PERFORMANCE_CONFIG;
    this.ui = ui; // Instance UI untuk feedback progress
  }

  /**
   * TODO:
   * Konfigurasi backend Transformers.js:
   * [] Cek ketersediaan WebGPU.
   * [] Set backend yang optimal.
   */
  async loadModel() {
    try {
      const { pipeline } = await import(this.config.cdnUrl);

      this.generator = await pipeline(
        'text2text-generation',
        this.config.modelName,
        {
          dtype: 'q4',
          progress_callback: createModelProgressCallback((progress) => {
            if (this.ui && typeof this.ui.showStatus === 'function') {
              this.ui.showStatus(progress.message);
            }
          }),
        },
      );

      this.isModelLoaded = true;

      return { success: true, model: this.config.modelName };
    } catch (error) {
      logError('Kesalahan memuat model Transformers.js', error);
      throw new Error(`Gagal memuat model generasi konten: ${error.message}`);
    }
  }

  async generateNutrition(fruitName) {
    if (!this.isModelLoaded || this.isGenerating) {
      throw new Error('Model belum siap atau sedang menghasilkan konten');
    }

    if (!fruitName || typeof fruitName !== 'string') {
      throw new Error('Nama buah yang valid diperlukan');
    }

    try {
      this.isGenerating = true;
      const startTime = performance.now();

      await createDelay(this.config.generationDelay);

      const MAX_LENGTH = 30;

      // Sanitize: Hapus karakter-karakter yang sering digunakan untuk prompt injection
      fruitName = fruitName
        .replace(/[|]{2,}/g, '') // Hapus ||| (separator injection)
        .replace(/[#=]{2,}/g, '') // Hapus ###, == (marker section)
        .replace(/(--|\+\+|``)/g, '') // Hapus --, ++, `` (marker kode)
        .replace(/\n/g, ' ') // Hapus newline
        .trim();

      // Validasi setelah sanitasi
      if (!fruitName || fruitName.length > MAX_LENGTH) {
        this.ui.showError(`Nama buah harus 1-${MAX_LENGTH} karakter.`);
        this.ui.enableAllInputs();
        this.isGenerating = false;
        return;
      }

      const prompt = `Write a simple nutrition fact about ${fruitName}. Include key nutritional benefits in 1-2 sentences.`;

      const result = await this.generator(prompt, {
        max_new_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        do_sample: true,
        top_p: this.config.topP,
      });

      const endTime = performance.now();
      const generationTime = endTime - startTime;

      updatePerformanceStats(this.performanceStats, generationTime);

      const generatedText = result[0].generated_text;
      const backendName = this.currentBackend;

      logPerformance(
        'Generative',
        backendName,
        generationTime,
        this.performanceStats.averageTime,
      );

      return {
        nutritionFact: generatedText.trim(),
        generated: true,
        performance: createPerformanceResult(
          generationTime,
          backendName,
          this.performanceStats.averageTime,
          this.performanceStats.operations,
        ),
      };
    } catch (error) {
      logError('Kesalahan menghasilkan konten nutrisi', error);
      throw new Error(`Gagal menghasilkan informasi nutrisi: ${error.message}`);
    } finally {
      this.isGenerating = false;
    }
  }

  isReady() {
    return this.isModelLoaded && !this.isGenerating;
  }
}

export default NutritionService;
