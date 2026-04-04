<script lang="ts">
import { TOUR_COMPLETE_KEY } from 'src/bandcamp/domain/storageKey';
import { sessionStorage } from 'src/core/shared';
import { console } from 'src/utils/console';
import { onMount } from 'svelte';

interface TourStep {
  id: string;
  targetElement?: string;
  title: string;
  message: string;
  delay?: number;
  useShadowRoot?: boolean;
}

interface Props {
  steps: TourStep[];
  autoStart?: boolean;
  onTourComplete?: () => void;
  onTourSkipped?: () => void;
}

let {
  steps,
  autoStart = true,
  onTourComplete,
  onTourSkipped,
}: Props = $props();

let currentStepIndex = $state(-1);
let isActive = $state(false);
let isCompleted = $state(false);
let highlightOverlay: HTMLElement | null = $state(null);
let hasActiveHighlight = $state(false);

onMount(async () => {
  if (!autoStart) return;

  try {
    const hasCompleted =
      await sessionStorage.getByKey<boolean>(TOUR_COMPLETE_KEY);
    if (!hasCompleted && steps.length > 0) {
      setTimeout(() => {
        startTour();
      }, 3000);
    }
  } catch (error) {
    console.warn('❌ BCX: Failed to check tour status:', error);
  }
});

function startTour() {
  if (isCompleted || steps.length === 0) return;

  currentStepIndex = 0;
  isActive = true;
  updateHighlight();
}

function updateHighlight() {
  cleanupHighlight();

  if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
    const step = steps[currentStepIndex];

    // Skip highlighting if no targetElement is specified
    if (!step.targetElement) {
      hasActiveHighlight = false;
      return;
    }

    hasActiveHighlight = true;

    // Check if element needs shadow root searching
    if (step.useShadowRoot) {
      waitForElement(step.targetElement, step.useShadowRoot, (element) => {
        highlightElement(element);
      });
      return;
    }

    const targetElement = findElement(step.targetElement);

    if (targetElement) {
      highlightElement(targetElement);
    } else {
      console.warn('❌ BCX Tour: Element not found:', step.targetElement);
      hasActiveHighlight = false;
    }
  } else {
    hasActiveHighlight = false;
  }
}

function findElement(selector: string): HTMLElement | null {
  // Handle CSS selector syntax
  if (selector.startsWith('#')) {
    return document.getElementById(selector.substring(1));
  } else if (selector.startsWith('.')) {
    return document.querySelector(selector) as HTMLElement;
  } else {
    // Fallback to querySelector for any other selector
    return document.querySelector(selector) as HTMLElement;
  }
}

function waitForElement(
  selector: string,
  useShadowRoot: boolean,
  callback: (element: HTMLElement) => void,
) {
  let attempts = 0;

  const checkForElement = () => {
    let element = findElement(selector);

    if (!element && useShadowRoot) {
      const bcxApp = document.getElementById('bcx-app');
      const shadowRoot = bcxApp?.shadowRoot;

      if (shadowRoot) {
        // Convert selector to class selector for shadow DOM search
        let classSelector = selector;
        if (selector.startsWith('#')) {
          // Convert #bcx-element-id to .bcx-element-id
          classSelector = '.' + selector.substring(1);
        }

        element = shadowRoot.querySelector(classSelector) as HTMLElement;
        if (element && selector.startsWith('#')) {
          // Assign the ID for future lookups
          element.id = selector.substring(1);
        }
      }

      // Fallback: try finding in regular DOM with class selector
      if (!element) {
        let classSelector = selector;
        if (selector.startsWith('#')) {
          classSelector = '.' + selector.substring(1);
        }

        element = document.querySelector(classSelector) as HTMLElement;
        if (element && selector.startsWith('#')) {
          element.id = selector.substring(1);
        }
      }
    }

    if (element) {
      callback(element);
      return;
    }

    attempts++;
    if (attempts >= 30) {
      console.warn('❌ BCX Tour: Element not found after waiting:', selector);
      return;
    }

    setTimeout(checkForElement, 100);
  };

  checkForElement();
}

function highlightElement(element: HTMLElement) {
  const elementId = element.id;

  if (elementId === 'bcx-drawer-button') {
    element.style.setProperty('opacity', '1', 'important');
    element.classList.add('near-edge');

    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      createHighlightOverlay(rect, elementId);
    }, 100);
    return;
  }

  const rect = element.getBoundingClientRect();
  createHighlightOverlay(rect, elementId);
}

function createHighlightOverlay(rect: DOMRect, elementId?: string) {
  const overlay = document.createElement('div');
  overlay.className = 'tour-highlight-overlay';

  if (elementId === 'bcx-drawer-button') {
    overlay.classList.add('tour-highlight-drawer');
  }

  overlay.style.cssText = `
    position: fixed;
    top: ${rect.top - 8}px;
    left: ${rect.left - 8}px;
    width: ${rect.width + 16}px;
    height: ${rect.height + 16}px;
    border: 3px solid #3b82f6;
    border-radius: 8px;
    background: rgba(59, 130, 246, 0.1);
    z-index: 1000000;
    pointer-events: none;
    animation: tour-highlight-pulse 2s ease-in-out infinite;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
  `;

  document.body.appendChild(overlay);
  highlightOverlay = overlay;
}

function cleanupHighlight() {
  const drawerButton = document.getElementById('bcx-drawer-button');
  if (
    drawerButton &&
    highlightOverlay?.classList.contains('tour-highlight-drawer')
  ) {
    drawerButton.style.opacity = '';
    drawerButton.classList.remove('near-edge');
  }

  if (highlightOverlay) {
    highlightOverlay.remove();
    highlightOverlay = null;
  }

  hasActiveHighlight = false;
}

function nextStep() {
  if (currentStepIndex >= steps.length - 1) {
    completeTour();
  } else {
    currentStepIndex++;
    updateHighlight();
  }
}

function previousStep() {
  if (currentStepIndex > 0) {
    currentStepIndex--;
    updateHighlight();
  }
}

async function completeTour() {
  cleanupHighlight();

  try {
    await sessionStorage.set({ [TOUR_COMPLETE_KEY]: true });
    isActive = false;
    isCompleted = true;
    currentStepIndex = -1;
    onTourComplete?.();
    console.log('✅ BCX: Tour completed');
  } catch (error) {
    console.warn('❌ BCX: Failed to save tour completion:', error);
  }
}

function skipTour() {
  cleanupHighlight();
  completeTour();
  onTourSkipped?.();
  console.log('⏭️ BCX: Tour skipped');
}

function resetTour() {
  sessionStorage.set({ [TOUR_COMPLETE_KEY]: false });
  isCompleted = false;
}

function startManually() {
  startTour();
}

export { resetTour, startManually };
</script>

{#if isActive && currentStepIndex >= 0 && currentStepIndex < steps.length}
  {@const step = steps[currentStepIndex]}
  {@const isLast = currentStepIndex === steps.length - 1}

  <div
    class="bcx-tour-overlay"
    class:has-highlight={hasActiveHighlight}
    onclick={skipTour}
    onkeydown={(e) => e.key === 'Escape' && skipTour()}
    role="button"
    tabindex="0"
    aria-label="Skip tour"
  ></div>
  <div class="bcx-tour-tooltip" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000000;">
    <div class="tour-content">
      <div class="tour-header">
        <h3>{step.title}</h3>
        <div class="tour-progress">{currentStepIndex + 1} of {steps.length}</div>
      </div>

      <p>{@html step.message}</p>

      <div class="tour-actions">
        <button onclick={skipTour} class="tour-btn-secondary">
          Skip Tour
        </button>
        <div class="tour-navigation">
          {#if currentStepIndex > 0}
            <button onclick={previousStep} class="tour-btn-secondary">
              Previous
            </button>
          {/if}
          <button onclick={nextStep} class="tour-btn-primary">
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.bcx-tour-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999999;
    backdrop-filter: blur(2px);
  }

  :global(.bcx-tour-overlay.has-highlight) {
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: none;
  }

  :global(.bcx-tour-tooltip) {
    max-width: 400px;
    background: #1f2937;
    border: 1px solid #374151;
    border-radius: 12px;
    color: #f9fafb;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    animation: tour-fade-in 0.3s ease-out;
  }

  :global(.bcx-tour-tooltip .tour-content) {
    padding: 1.5rem;
  }

  :global(.bcx-tour-tooltip .tour-header) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #374151;
  }

  :global(.bcx-tour-tooltip .tour-header h3) {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
  }

  :global(.bcx-tour-tooltip .tour-progress) {
    font-size: 0.875rem;
    color: #9ca3af;
    background: #374151;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
  }

  :global(.bcx-tour-tooltip p) {
    margin: 0 0 1.5rem 0;
    font-size: 0.9rem;
    line-height: 1.5;
    color: #d1d5db;
  }

  :global(.bcx-tour-tooltip .tour-actions) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  :global(.bcx-tour-tooltip .tour-navigation) {
    display: flex;
    gap: 0.5rem;
  }

  :global(.bcx-tour-tooltip .tour-btn-primary) {
    background: #3b82f6;
    border: 1px solid #2563eb;
    color: white;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
  }

  :global(.bcx-tour-tooltip .tour-btn-primary:hover) {
    background: #2563eb;
    border-color: #1d4ed8;
  }

  :global(.bcx-tour-tooltip .tour-btn-secondary) {
    background: transparent;
    border: 1px solid #4b5563;
    color: #d1d5db;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  :global(.bcx-tour-tooltip .tour-btn-secondary:hover) {
    background: #374151;
    border-color: #6b7280;
    color: #f9fafb;
  }

  @keyframes tour-fade-in {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @keyframes tour-highlight-pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.02);
    }
  }

  :global(.tour-highlight-overlay) {
    animation: tour-highlight-pulse 2s ease-in-out infinite;
  }

  :global(.tour-highlight-overlay.tour-highlight-drawer) {
    border-width: 4px;
    background: rgba(59, 130, 246, 0.2);
    box-shadow:
      0 0 0 6px rgba(59, 130, 246, 0.3),
      0 0 20px rgba(59, 130, 246, 0.4);
  }
</style>
