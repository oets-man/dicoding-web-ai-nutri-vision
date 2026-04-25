export const APP_CONFIG = {
  analyzingDelay: 2000,
  nutritionGenerationDelay: 2000,
  detectionRetryInterval: 100,
};

export const TENSORFLOW_CONFIG = {
  modelPath: './model/model.json',
  metadataPath: './model/metadata.json',
  inputSize: [224, 224],
  normalizationFactor: 255.0,
  confidenceThresholds: {
    excellent: 70,
    good: 50,
  },
};

export const TRANSFORMERS_CONFIG = {
  modelName: 'Xenova/LaMini-Flan-T5-77M',
  cdnUrl: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1',
  maxTokens: 80,
  temperature: 0.3,
  topP: 0.8,
  generationDelay: 500,
};

export const UI_CONFIG = {
  animationDuration: 300,
  fadeAnimation: 'fadeIn 0.5s ease-out forwards',
  nutritionCardOpacity: {
    loading: 0.6,
    normal: 1.0,
  },
};

export const CAMERA_CONFIG = {
  defaultFPS: 30,
  fpsRange: { min: 15, max: 60 },
  desktopResolution: { width: 640, height: 480 },
  mobileResolution: { width: 480, height: 640 },
  desktopFacingMode: 'user',
  mobileFacingMode: 'environment',
};

export const PERFORMANCE_CONFIG = {
  operations: 0,
  totalTime: 0,
  averageTime: 0,
};
