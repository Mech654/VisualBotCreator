// Transitions and animations system for VisualBotCreator
// Provides a set of reusable transitions for creating smooth user experiences
import { clearConnections } from '../services/connectionService/connectionService.js';
import { initializeNodes } from '../services/nodeService/nodeState.js';

/**
 * Shows a full-page transition when navigating between pages
 * @param destination The URL to navigate to after the transition
 * @param options Optional configuration for the transition
 */
export function showPageTransition(
  destination: string,
  options: {
    message?: string;
    delay?: number;
    fadeColor?: string;
  } = {}
): void {
  const message = options.message || 'Loading...';
  const delay = options.delay || 400;
  const fadeColor = options.fadeColor || 'var(--dark)';

  let pageTransition = document.querySelector('.page-transition') as HTMLElement;
  if (!pageTransition) {
    pageTransition = document.createElement('div');
    pageTransition.className = 'page-transition';

    const transitionContent = document.createElement('div');
    transitionContent.className = 'transition-content';

    const iconElement = document.createElement('img');
    iconElement.className = 'transition-icon';
    iconElement.src = '/assets/images/mascot.png';
    iconElement.alt = 'Loading Mascot';

    const messageElement = document.createElement('span');
    messageElement.className = 'transition-message';
    messageElement.textContent = message;

    transitionContent.appendChild(iconElement);
    transitionContent.appendChild(messageElement);
    pageTransition.appendChild(transitionContent);

    document.body.appendChild(pageTransition);

    if (!document.getElementById('transition-styles')) {
      injectTransitionStyles();
    }
  } else {
    // If transition element exists, update the message but keep the mascot image
    const messageElement = pageTransition.querySelector('.transition-message') as HTMLElement;
    if (messageElement) messageElement.textContent = message;
  }

  // Update color if specified
  pageTransition.style.backgroundColor = fadeColor;

  // Activate transition
  pageTransition.classList.add('active');

  setTimeout(() => {
    window.location.href = destination;
  }, delay);

  if (window && (window as any).nodeSystem?.clearAllNodes) {
    (window as any).nodeSystem.clearAllNodes();

    // Also clear frontend connections and node tracking
    clearConnections();
    initializeNodes();
  }
}

/**
 * Creates a transition for an element entering the DOM
 * @param element The element to animate
 * @param type Type of entrance animation
 * @param duration Duration of the animation in ms
 * @param delay Delay before starting the animation in ms
 */
export function enterTransition(
  element: HTMLElement,
  type:
    | 'fade'
    | 'slide-up'
    | 'slide-down'
    | 'slide-left'
    | 'slide-right'
    | 'scale'
    | 'flip' = 'fade',
  duration: number = 300,
  delay: number = 0
): void {
  if (!document.getElementById('transition-styles')) {
    injectTransitionStyles();
  }

  // Reset any existing animations
  element.style.animation = '';

  // Force a reflow to ensure the animation runs
  void element.offsetWidth;

  // Apply enter animation
  element.style.animationDuration = `${duration}ms`;
  element.style.animationDelay = `${delay}ms`;
  element.style.animationFillMode = 'both';

  switch (type) {
    case 'fade':
      element.style.animation = 'fadeIn';
      break;
    case 'slide-up':
      element.style.animation = 'slideInUp';
      break;
    case 'slide-down':
      element.style.animation = 'slideInDown';
      break;
    case 'slide-left':
      element.style.animation = 'slideInLeft';
      break;
    case 'slide-right':
      element.style.animation = 'slideInRight';
      break;
    case 'scale':
      element.style.animation = 'scaleIn';
      break;
    case 'flip':
      element.style.animation = 'flipIn';
      break;
  }
}

/**
 * Creates a transition for an element leaving the DOM
 * @param element The element to animate
 * @param type Type of exit animation
 * @param duration Duration of the animation in ms
 * @param delay Delay before starting the animation in ms
 * @param removeAfter Whether to remove the element after animation
 * @returns Promise that resolves when the animation completes
 */
export function exitTransition(
  element: HTMLElement,
  type:
    | 'fade'
    | 'slide-up'
    | 'slide-down'
    | 'slide-left'
    | 'slide-right'
    | 'scale'
    | 'flip' = 'fade',
  duration: number = 300,
  delay: number = 0,
  removeAfter: boolean = false
): Promise<void> {
  return new Promise(resolve => {
    if (!document.getElementById('transition-styles')) {
      injectTransitionStyles();
    }

    // Reset any existing animations
    element.style.animation = '';

    // Force a reflow to ensure the animation runs
    void element.offsetWidth;

    // Apply exit animation
    element.style.animationDuration = `${duration}ms`;
    element.style.animationDelay = `${delay}ms`;
    element.style.animationFillMode = 'both';

    switch (type) {
      case 'fade':
        element.style.animation = 'fadeOut';
        break;
      case 'slide-up':
        element.style.animation = 'slideOutUp';
        break;
      case 'slide-down':
        element.style.animation = 'slideOutDown';
        break;
      case 'slide-left':
        element.style.animation = 'slideOutLeft';
        break;
      case 'slide-right':
        element.style.animation = 'slideOutRight';
        break;
      case 'scale':
        element.style.animation = 'scaleOut';
        break;
      case 'flip':
        element.style.animation = 'flipOut';
        break;
    }

    setTimeout(() => {
      if (removeAfter) {
        element.remove();
      }
      resolve();
    }, duration + delay);
  });
}

/**
 * Adds a highlight effect to an element to draw attention
 * @param element Element to highlight
 * @param color Color for the highlight effect (default: primary color)
 * @param duration Duration of the highlight in ms
 */
export function highlightElement(
  element: HTMLElement,
  color: string = 'var(--primary)',
  duration: number = 1000
): void {
  if (!document.getElementById('transition-styles')) {
    injectTransitionStyles();
  }

  const highlightOverlay = document.createElement('div');
  highlightOverlay.className = 'highlight-overlay';
  highlightOverlay.style.position = 'absolute';
  highlightOverlay.style.inset = '0';
  highlightOverlay.style.backgroundColor = color;
  highlightOverlay.style.pointerEvents = 'none';
  highlightOverlay.style.borderRadius = 'inherit';

  // Store original position if not already set
  if (element.style.position === '' || element.style.position === 'static') {
    element.style.position = 'relative';
  }

  element.appendChild(highlightOverlay);

  // Apply animation
  highlightOverlay.animate([{ opacity: 0.6 }, { opacity: 0 }], {
    duration,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }).onfinish = () => {
    highlightOverlay.remove();
  };
}

/**
 * Creates a ripple effect on an element (useful for buttons and interactive elements)
 * @param element Target element for the ripple effect
 * @param event Mouse or touch event that triggered the ripple
 * @param color Color of the ripple effect
 */
export function createRippleEffect(
  element: HTMLElement,
  event: MouseEvent | TouchEvent,
  color: string = 'rgba(255, 255, 255, 0.3)'
): void {
  // Get click position
  const rect = element.getBoundingClientRect();
  let x, y;

  if (event instanceof MouseEvent) {
    x = event.clientX - rect.left;
    y = event.clientY - rect.top;
  } else {
    // TouchEvent
    x = event.touches[0].clientX - rect.left;
    y = event.touches[0].clientY - rect.top;
  }

  // Create ripple element
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.position = 'absolute';
  ripple.style.backgroundColor = color;
  ripple.style.borderRadius = '50%';
  ripple.style.pointerEvents = 'none';
  ripple.style.transformOrigin = 'center';

  // Store original position if not already set
  if (element.style.position === '' || element.style.position === 'static') {
    element.style.position = 'relative';
  }

  // Calculate size based on element dimensions
  const size = Math.max(rect.width, rect.height) * 2;

  // Position ripple at click coordinates
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x - size / 2}px`;
  ripple.style.top = `${y - size / 2}px`;

  element.appendChild(ripple);

  // Apply ripple animation
  ripple.animate(
    [
      { transform: 'scale(0)', opacity: 0.7 },
      { transform: 'scale(1)', opacity: 0 },
    ],
    {
      duration: 700,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
  ).onfinish = () => {
    ripple.remove();
  };
}

/**
 * Adds ripple event listeners to an element or collection of elements
 * @param selector CSS selector for elements or a single HTMLElement
 * @param color Optional color for the ripple effect
 */
export function addRippleEffect(
  selector: string | HTMLElement | NodeListOf<HTMLElement>,
  color?: string
): void {
  const elements =
    typeof selector === 'string'
      ? document.querySelectorAll<HTMLElement>(selector)
      : selector instanceof HTMLElement
        ? [selector]
        : selector;

  elements.forEach(element => {
    const handleRipple = (event: MouseEvent | TouchEvent) => {
      createRippleEffect(element, event, color);
    };

    element.addEventListener('mousedown', handleRipple);
    element.addEventListener('touchstart', handleRipple, { passive: true });

    // Add a class to indicate it has ripple effect
    element.classList.add('has-ripple');
  });
}

/**
 * Creates a typing animation for text elements
 * @param element Target element for typing animation
 * @param text Text to type
 * @param speed Speed of typing in ms per character
 * @param startDelay Delay before starting in ms
 * @param cursorChar Character to use as cursor
 * @returns Promise that resolves when typing completes
 */
export function typeText(
  element: HTMLElement,
  text: string,
  speed: number = 50,
  startDelay: number = 0,
  cursorChar: string = '|'
): Promise<void> {
  return new Promise(resolve => {
    const originalText = text;
    element.textContent = '';

    // Create and append cursor element
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.textContent = cursorChar;
    cursor.style.animation = 'cursorBlink 1s infinite';
    element.appendChild(cursor);

    // Add cursor blinking animation if not already present
    if (!document.getElementById('transition-styles')) {
      injectTransitionStyles();
    }

    setTimeout(() => {
      let i = 0;
      const typeNextChar = () => {
        if (i < originalText.length) {
          // Insert character before cursor
          cursor.insertAdjacentText('beforebegin', originalText.charAt(i));
          i++;
          setTimeout(typeNextChar, speed);
        } else {
          // Keep cursor blinking for a bit, then remove
          setTimeout(() => {
            cursor.remove();
            resolve();
          }, 1000);
        }
      };
      typeNextChar();
    }, startDelay);
  });
}

/**
 * Creates a sequential animation for a list of elements
 * @param elements Array of elements or CSS selector
 * @param animationType Type of animation to apply
 * @param staggerDelay Delay between each element animation in ms
 * @param duration Duration of each element animation in ms
 */
export function staggerAnimation(
  elements: HTMLElement[] | NodeListOf<Element> | string,
  animationType: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale',
  staggerDelay: number = 100,
  duration: number = 300
): void {
  const elementList =
    typeof elements === 'string'
      ? Array.from(document.querySelectorAll(elements))
      : elements instanceof NodeList
        ? Array.from(elements)
        : elements;

  elementList.forEach((el, index) => {
    const delay = index * staggerDelay;
    enterTransition(el as HTMLElement, animationType, duration, delay);
  });
}

/**
 * Injects all transition and animation styles into the document head
 */
function injectTransitionStyles(): void {
  const style = document.createElement('style');
  style.id = 'transition-styles';
  style.textContent = `
    /* Page Transition Styles */
    .page-transition {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--dark);
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
    }
    
    .page-transition.active {
      opacity: 1;
      visibility: visible;
    }
    
    .transition-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    
    .transition-icon {
      width: 60px;
      height: 60px;
      object-fit: contain;
      margin: 0 auto 16px;
      animation: pulse 1.5s infinite ease-in-out;
    }
    
    .transition-message {
      color: white;
      font-size: 18px;
      font-weight: 500;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    /* Cursor blink animation */
    @keyframes cursorBlink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    
    /* Fade animations */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    
    /* Slide animations */
    @keyframes slideInUp {
      from { 
        transform: translateY(20px); 
        opacity: 0;
      }
      to { 
        transform: translateY(0); 
        opacity: 1;
      }
    }
    
    @keyframes slideOutUp {
      from { 
        transform: translateY(0); 
        opacity: 1;
      }
      to { 
        transform: translateY(-20px); 
        opacity: 0;
      }
    }
    
    @keyframes slideInDown {
      from { 
        transform: translateY(-20px); 
        opacity: 0;
      }
      to { 
        transform: translateY(0); 
        opacity: 1;
      }
    }
    
    @keyframes slideOutDown {
      from { 
        transform: translateY(0); 
        opacity: 1;
      }
      to { 
        transform: translateY(20px); 
        opacity: 0;
      }
    }
    
    @keyframes slideInLeft {
      from { 
        transform: translateX(20px); 
        opacity: 0;
      }
      to { 
        transform: translateX(0); 
        opacity: 1;
      }
    }
    
    @keyframes slideOutLeft {
      from { 
        transform: translateX(0); 
        opacity: 1;
      }
      to { 
        transform: translateX(-20px); 
        opacity: 0;
      }
    }
    
    @keyframes slideInRight {
      from { 
        transform: translateX(-20px); 
        opacity: 0;
      }
      to { 
        transform: translateX(0); 
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from { 
        transform: translateX(0); 
        opacity: 1;
      }
      to { 
        transform: translateX(20px); 
        opacity: 0;
      }
    }
    
    /* Scale animations */
    @keyframes scaleIn {
      from { 
        transform: scale(0.9); 
        opacity: 0; 
      }
      to { 
        transform: scale(1); 
        opacity: 1; 
      }
    }
    
    @keyframes scaleOut {
      from { 
        transform: scale(1); 
        opacity: 1; 
      }
      to { 
        transform: scale(0.9); 
        opacity: 0; 
      }
    }
    
    /* Flip animations */
    @keyframes flipIn {
      from { 
        transform: perspective(400px) rotateX(-90deg);
        opacity: 0;
      }
      to { 
        transform: perspective(400px) rotateX(0);
        opacity: 1;
      }
    }
    
    @keyframes flipOut {
      from { 
        transform: perspective(400px) rotateX(0);
        opacity: 1;
      }
      to { 
        transform: perspective(400px) rotateX(90deg);
        opacity: 0;
      }
    }
    
    /* Pulse animation */
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }
    
    /* Attention animations */
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-20px); }
      60% { transform: translateY(-10px); }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    @keyframes wobble {
      0% { transform: translateX(0%); }
      15% { transform: translateX(-25%) rotate(-5deg); }
      30% { transform: translateX(20%) rotate(3deg); }
      45% { transform: translateX(-15%) rotate(-3deg); }
      60% { transform: translateX(10%) rotate(2deg); }
      75% { transform: translateX(-5%) rotate(-1deg); }
      100% { transform: translateX(0%); }
    }
    
    /* Ripple effect for buttons */
    .ripple {
      position: absolute;
      transform: scale(0);
      border-radius: 50%;
      animation: rippleEffect 0.6s linear;
      background-color: rgba(255, 255, 255, 0.3);
    }
    
    @keyframes rippleEffect {
      to {
        transform: scale(2);
        opacity: 0;
      }
    }
    
    /* For elements with ripple effect */
    .has-ripple {
      position: relative;
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Adds attention-grabbing animation to an element
 * @param element Element to animate
 * @param type Type of attention animation
 * @param duration Duration in milliseconds
 */
export function addAttentionAnimation(
  element: HTMLElement,
  type: 'bounce' | 'shake' | 'wobble' = 'bounce',
  duration: number = 1000
): void {
  if (!document.getElementById('transition-styles')) {
    injectTransitionStyles();
  }

  // Prevent animation stacking
  element.style.animation = '';
  void element.offsetWidth; // Force reflow

  element.style.animation = `${type} ${duration}ms`;

  // Clear animation when done
  setTimeout(() => {
    element.style.animation = '';
  }, duration);
}
