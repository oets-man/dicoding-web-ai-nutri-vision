import { UI_CONFIG } from '../core/config.js';
import {
  getConfidenceTextClass,
  getConfidenceCardClass,
  addFadeInAnimation,
  addScaleAnimation,
  hideElement,
  showElement,
  setElementOpacity,
  setElementText,
  setElementHTML,
  logError,
} from '../core/utils.js';

class UIHandler {
  constructor() {
    this.config = UI_CONFIG;
    this.cleanupFunctions = [];
    this.initializeElements();
  }

  initializeElements() {
    // Status elements
    this.statusBadge = document.querySelector('.status-badge span:last-child');
    this.statusDot = document.getElementById('status-dot');
    this.statusText = document.getElementById('status-text');

    // Camera elements
    this.btnToggle = document.getElementById('btn-toggle');
    this.btnText = document.getElementById('btn-text');
    this.cameraSelect = document.getElementById('camera-select');
    this.fpsSlider = document.getElementById('fps-slider');
    this.fpsValue = document.getElementById('fps-value');

    // Viewport elements
    this.viewInactive = document.getElementById('view-inactive');
    this.viewActive = document.getElementById('view-active');
    this.scannerOverlay = document.getElementById('scanner-overlay');

    // State elements
    this.stateIdle = document.getElementById('state-idle');
    this.stateAnalyzing = document.getElementById('state-analyzing');
    this.stateResult = document.getElementById('state-result');

    // Result elements
    this.resultCard = document.getElementById('result-card');
    this.resName = document.getElementById('res-name');
    this.resConfidence = document.getElementById('res-confidence');
    this.resBar = document.getElementById('res-bar');
    this.nutriFact = document.getElementById('nutri-fact');

    // Cache nutrition elements
    this.nutritionCard = document.querySelector('.nutrition-card');
    this.nutriHeader = document.querySelector('.nutri-header h3');

    // Cache all input elements for disabling during generation
    this.inputElements = [
      this.btnToggle,
      this.cameraSelect,
      this.fpsSlider,
    ].filter((el) => el !== null); // Remove null elements
  }

  switchToState(newState) {
    hideElement(this.stateIdle);
    hideElement(this.stateAnalyzing);
    hideElement(this.stateResult);

    switch (newState) {
      case 'idle':
        showElement(this.stateIdle);
        break;
      case 'analyzing':
        showElement(this.stateAnalyzing);
        break;
      case 'result':
        showElement(this.stateResult);
        break;
    }
  }

  updateCameraUI(isActive, preserveStates = false) {
    if (isActive) {
      this.btnToggle.classList.remove('btn-start');
      this.btnToggle.classList.add('btn-stop');
      this.btnText.textContent = 'Berhenti Scan';
    } else {
      this.btnToggle.classList.remove('btn-stop');
      this.btnToggle.classList.add('btn-start');
      this.btnText.textContent = 'Mulai Scan';
    }

    this.viewInactive.style.display = isActive ? 'none' : 'flex';
    this.viewActive.style.display = isActive ? 'block' : 'none';
    this.scannerOverlay.style.display = isActive ? 'block' : 'none';

    if (isActive) {
      this.statusDot.classList.add('active');
      this.statusText.textContent = 'SIARAN LANGSUNG';
    } else {
      this.statusDot.classList.remove('active');
      this.statusText.textContent = 'OFFLINE';
    }

    if (!preserveStates) {
      if (isActive) {
        this.switchToState('analyzing');
      } else {
        this.switchToState('idle');
      }
    }
  }

  enableButton() {
    if (this.btnToggle) {
      this.btnToggle.disabled = false;
      this.btnToggle.style.opacity = '1';
      this.btnToggle.style.cursor = 'pointer';
      this.btnText.textContent = 'Mulai Scan';
    }
  }

  disableButton(reason = 'Memuat...') {
    if (this.btnToggle) {
      this.btnToggle.disabled = true;
      this.btnToggle.style.opacity = '0.6';
      this.btnToggle.style.cursor = 'not-allowed';
      this.btnText.textContent = reason;
    }
  }

  disableAllInputs() {
    this.inputElements.forEach((element) => {
      if (element) {
        element.disabled = true;
        element.style.opacity = '0.6';
        element.style.cursor = 'not-allowed';
      }
    });
  }

  enableAllInputs() {
    this.inputElements.forEach((element) => {
      if (element) {
        element.disabled = false;
        element.style.opacity = '1';
        element.style.cursor = 'pointer';
      }
    });

    // Reset button text
    if (this.btnText) {
      this.btnText.textContent = 'Mulai Scan';
    }
  }

  updateNutritionState(state, content = null) {
    if (!this.nutritionCard || !this.nutriHeader) return;

    switch (state) {
      case 'loading':
        // Disable all inputs during generation
        this.disableAllInputs();

        setElementOpacity(
          this.nutritionCard,
          this.config.nutritionCardOpacity.loading,
        );
        setElementHTML(this.nutriHeader, '🤖 Menghasilkan Fakta Nutrisi...');
        if (this.nutriFact) {
          setElementText(this.nutriFact, 'Menghasilkan informasi nutrisi...');
        }
        break;

      case 'success':
        // Re-enable all inputs after generation
        this.enableAllInputs();

        setElementOpacity(
          this.nutritionCard,
          this.config.nutritionCardOpacity.normal,
        );
        setElementHTML(this.nutriHeader, 'Fakta Nutrisi');
        if (content && this.nutriFact) {
          addScaleAnimation(this.nutriFact, () => {
            setElementText(this.nutriFact, content);
          });
        }
        break;

      case 'error':
        // Re-enable all inputs after error
        this.enableAllInputs();

        setElementOpacity(
          this.nutritionCard,
          this.config.nutritionCardOpacity.normal,
        );
        setElementHTML(this.nutriHeader, 'Fakta Nutrisi (Tidak Tersedia)');
        if (this.nutriFact) {
          setElementText(
            this.nutriFact,
            'Tidak dapat menghasilkan informasi nutrisi saat ini.',
          );
        }
        break;
    }
  }

  showResults(prediction, nutrition) {
    this.switchToState('result');

    setElementText(this.resName, prediction.className);
    setElementText(this.resConfidence, `${prediction.confidence}%`);
    this.resBar.style.width = `${prediction.confidence}%`;

    this.resultCard.classList.remove(
      'theme-green',
      'theme-red',
      'theme-yellow',
    );
    this.resConfidence.classList.remove(
      'text-green',
      'text-red',
      'text-yellow',
    );

    const cardClass = getConfidenceCardClass(prediction.confidence);
    const textClass = getConfidenceTextClass(prediction.confidence);

    this.resultCard.classList.add(cardClass);
    this.resConfidence.classList.add(textClass);

    if (!nutrition) {
      if (this.nutriFact) {
        setElementText(this.nutriFact, 'Menghasilkan informasi nutrisi...');
      }
    } else {
      if (this.nutriFact) {
        setElementText(this.nutriFact, nutrition.nutritionFact);
      }
    }

    addFadeInAnimation(this.stateResult);
  }

  showStatus(message) {
    setElementText(this.statusBadge, message);
  }

  showError(message) {
    logError('Error UI', new Error(message));

    if (this.statusBadge) {
      this.statusBadge.textContent = `Error: ${message}`;
      this.statusBadge.style.color = 'var(--danger)';
    }

    setTimeout(() => {
      this.updateCameraUI(false);
      // Reset status after error
      if (this.statusBadge) {
        this.statusBadge.textContent = 'Model AI Siap';
        this.statusBadge.style.color = '';
      }
    }, 3000);
  }

  bindEvents(callbacks) {
    // Clean up previous events first
    this.unbindEvents();

    if (this.btnToggle && callbacks.onToggleCamera) {
      const handler = (e) => {
        if (this.btnToggle.disabled) {
          e.preventDefault();
          return;
        }
        callbacks.onToggleCamera();
      };

      this.btnToggle.addEventListener('click', handler);

      // Store cleanup function - easy to understand!
      this.cleanupFunctions.push(() => {
        this.btnToggle.removeEventListener('click', handler);
      });
    }

    if (this.fpsSlider && callbacks.onFPSChange) {
      const handler = (e) => {
        this.fpsValue.textContent = e.target.value;
        callbacks.onFPSChange(parseInt(e.target.value));
      };

      this.fpsSlider.addEventListener('input', handler);

      // Store cleanup function
      this.cleanupFunctions.push(() => {
        this.fpsSlider.removeEventListener('input', handler);
      });
    }

    if (this.cameraSelect && callbacks.onCameraChange) {
      const handler = callbacks.onCameraChange;

      this.cameraSelect.addEventListener('change', handler);

      // Store cleanup function
      this.cleanupFunctions.push(() => {
        this.cameraSelect.removeEventListener('change', handler);
      });
    }
  }

  unbindEvents() {
    this.cleanupFunctions.forEach((cleanup) => cleanup());
    this.cleanupFunctions = [];
  }
}

export default UIHandler;
