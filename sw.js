importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js',
);
if (workbox) {
  console.log('Workbox dimuat');
  workbox.precaching.precacheAndRoute([
    { url: '/', revision: '1.0.0' },
    { url: '/index.html', revision: '1.0.0' },
    { url: '/assets/css/styles.css', revision: '1.0.0' },
    { url: '/assets/js/core/app.js', revision: '1.0.0' },
    { url: '/assets/js/core/config.js', revision: '1.0.0' },
    { url: '/assets/js/core/utils.js', revision: '1.0.0' },
    { url: '/assets/js/services/camera.service.js', revision: '1.0.0' },
    { url: '/assets/js/services/detection.service.js', revision: '1.0.0' },
    { url: '/assets/js/services/nutrition.service.js', revision: '1.0.0' },
    { url: '/assets/js/ui/ui.handler.js', revision: '1.0.0' },
    { url: '/assets/icons/android-chrome-192x192.png', revision: '1.0.0' },
    { url: '/assets/icons/apple-touch-icon.png', revision: '1.0.0' },

    { url: '/model/model.json', revision: '1.0.0' },
    { url: '/model/metadata.json', revision: '1.0.0' },
    { url: '/model/weights.bin', revision: '1.0.0' },
    { url: '/manifest.json', revision: '1.0.0' },
    {
      url: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js',
      revision: '1.0.0',
    },
    {
      url: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgpu@4.22.0/dist/tf-backend-webgpu.min.js',
      revision: '1.0.0',
    },
    {
      url: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1',
      revision: '1.0.0',
    },
  ]);
} else {
  console.log('Workbox gagal dimuat');
}
