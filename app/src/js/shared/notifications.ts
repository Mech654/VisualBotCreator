/**
 * Global Notification System for VisualBotCreator
 * Provides a unified notification system across all pages with customizable styling
 */

export interface NotificationOptions {
  /** Type of notification affecting the styling */
  type?: 'success' | 'error' | 'info' | 'warning';
  /** Duration in milliseconds (0 for persistent) */
  duration?: number;
  /** Position on screen */
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  /** Whether notification can be manually dismissed */
  dismissible?: boolean;
  /** Custom icon (emoji or HTML) */
  icon?: string;
  /** Additional CSS classes for custom styling */
  customClasses?: string[];
  /** Callback when notification is dismissed */
  onDismiss?: () => void;
  /** Callback when notification is clicked */
  onClick?: () => void;
}

export interface NotificationConfig {
  /** Maximum number of notifications to show simultaneously */
  maxNotifications?: number;
  /** Default duration for auto-dismiss */
  defaultDuration?: number;
  /** Default position for notifications */
  defaultPosition?: NotificationOptions['position'];
  /** Global animation duration */
  animationDuration?: number;
}

class NotificationSystem {
  private container: HTMLElement | null = null;
  private notifications: Set<HTMLElement> = new Set();
  private config: Required<NotificationConfig>;
  private notificationCounter = 0;

  constructor(config: NotificationConfig = {}) {
    this.config = {
      maxNotifications: config.maxNotifications ?? 5,
      defaultDuration: config.defaultDuration ?? 4000,
      defaultPosition: config.defaultPosition ?? 'top-right',
      animationDuration: config.animationDuration ?? 300,
    };

    this.initializeContainer();
    this.injectStyles();
  }

  private initializeContainer(): void {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'notification-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-label', 'Notifications');
      document.body.appendChild(this.container);
    }
  }

  private injectStyles(): void {
    if (document.getElementById('notification-system-styles')) return;

    const style = document.createElement('style');
    style.id = 'notification-system-styles';
    style.textContent = `
      .notification-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 10000;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 400px;
        width: auto;
      }

      .notification-container.position-top-left {
        top: 1rem;
        left: 1rem;
        right: auto;
      }

      .notification-container.position-bottom-right {
        top: auto;
        bottom: 1rem;
        right: 1rem;
      }

      .notification-container.position-bottom-left {
        top: auto;
        bottom: 1rem;
        left: 1rem;
        right: auto;
      }

      .notification-container.position-top-center {
        top: 1rem;
        left: 50%;
        right: auto;
        transform: translateX(-50%);
      }

      .notification-container.position-bottom-center {
        top: auto;
        bottom: 1rem;
        left: 50%;
        right: auto;
        transform: translateX(-50%);
      }

      .vbc-notification {
        background: transparent;
        border: 2px solid var(--notification-border-color, #bb86fc);
        border-radius: 8px;
        padding: 12px 16px;
        color: var(--notification-text-color, #ffffff);
        font-size: 14px;
        font-family: 'Segoe UI', 'Roboto', sans-serif;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        pointer-events: auto;
        cursor: default;
        position: relative;
        opacity: 0;
        transform: translateX(100%) scale(0.9);
        transition: all var(--notification-animation-duration, 300ms) cubic-bezier(0.4, 0, 0.2, 1);
        min-width: 250px;
        max-width: 400px;
        word-wrap: break-word;
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }

      .vbc-notification.show {
        opacity: 1;
        transform: translateX(0) scale(1);
      }

      .vbc-notification.hiding {
        opacity: 0;
        transform: translateX(100%) scale(0.9);
      }

      .vbc-notification.position-left .vbc-notification {
        transform: translateX(-100%) scale(0.9);
      }

      .vbc-notification.position-left.hiding .vbc-notification {
        transform: translateX(-100%) scale(0.9);
      }

      .vbc-notification.type-success {
        border-color: var(--notification-success-color, #2ecc71);
      }

      .vbc-notification.type-error {
        border-color: var(--notification-error-color, #cf6679);
      }

      .vbc-notification.type-warning {
        border-color: var(--notification-warning-color, #f39c12);
      }

      .vbc-notification.type-info {
        border-color: var(--notification-info-color, #3498db);
      }

      .vbc-notification-icon {
        flex-shrink: 0;
        font-size: 16px;
        line-height: 1;
        margin-top: 1px;
      }

      .vbc-notification-content {
        flex: 1;
        line-height: 1.4;
      }

      .vbc-notification-dismiss {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        padding: 0;
        margin-left: 8px;
        opacity: 0.7;
        transition: opacity 150ms;
        flex-shrink: 0;
      }

      .vbc-notification-dismiss:hover {
        opacity: 1;
      }

      .vbc-notification-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background: currentColor;
        opacity: 0.3;
        transform-origin: left;
        animation: notification-progress var(--progress-duration, 4000ms) linear;
      }

      @keyframes notification-progress {
        from { transform: scaleX(1); }
        to { transform: scaleX(0); }
      }

      .vbc-notification:hover .vbc-notification-progress {
        animation-play-state: paused;
      }

      /* Accessibility improvements */
      @media (prefers-reduced-motion: reduce) {
        .vbc-notification {
          transition: opacity var(--notification-animation-duration, 300ms);
          transform: none;
        }
        
        .vbc-notification.show {
          transform: none;
        }
        
        .vbc-notification.hiding {
          transform: none;
        }
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .vbc-notification {
          border-width: 3px;
          background: rgba(0, 0, 0, 0.9);
        }
      }
    `;

    document.head.appendChild(style);
  }

  private getDefaultIcon(type: string): string {
    const icons: Record<string, string> = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };
    return icons[type] || '';
  }

  private updateContainerPosition(position: NotificationOptions['position']): void {
    if (!this.container) return;

    // Remove all position classes
    this.container.className = 'notification-container';

    // Add new position class
    if (position !== 'top-right') {
      this.container.classList.add(`position-${position}`);
    }
  }

  private enforceMaxNotifications(): void {
    if (this.notifications.size >= this.config.maxNotifications) {
      const oldest = Array.from(this.notifications)[0];
      this.dismissNotification(oldest);
    }
  }

  private dismissNotification(notification: HTMLElement): void {
    if (!this.notifications.has(notification)) return;

    notification.classList.add('hiding');

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      this.notifications.delete(notification);

      // Call onDismiss callback if it exists
      const onDismiss = (notification as any)._onDismiss;
      if (typeof onDismiss === 'function') {
        onDismiss();
      }
    }, this.config.animationDuration);
  }

  /**
   * Show a notification
   */
  public show(message: string, options: NotificationOptions = {}): HTMLElement {
    const {
      type = 'info',
      duration = this.config.defaultDuration,
      position = this.config.defaultPosition,
      dismissible = true,
      icon,
      customClasses = [],
      onDismiss,
      onClick,
    } = options;

    this.enforceMaxNotifications();
    this.updateContainerPosition(position);

    const notification = document.createElement('div');
    const notificationId = `notification-${++this.notificationCounter}`;

    notification.id = notificationId;
    notification.className = ['vbc-notification', `type-${type}`, ...customClasses].join(' ');

    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');

    // Store callback for later use
    if (onDismiss) {
      (notification as any)._onDismiss = onDismiss;
    }

    // Create notification content
    const iconElement = icon !== undefined ? icon : this.getDefaultIcon(type);
    const iconHtml = iconElement ? `<div class="vbc-notification-icon">${iconElement}</div>` : '';

    const dismissButton = dismissible
      ? '<button class="vbc-notification-dismiss" aria-label="Dismiss notification" title="Dismiss">×</button>'
      : '';

    notification.innerHTML = `
      ${iconHtml}
      <div class="vbc-notification-content">${message}</div>
      ${dismissButton}
    `;

    // Add progress bar for timed notifications
    if (duration > 0) {
      const progress = document.createElement('div');
      progress.className = 'vbc-notification-progress';
      progress.style.setProperty('--progress-duration', `${duration}ms`);
      notification.appendChild(progress);
    }

    // Add event listeners
    if (dismissible) {
      const dismissBtn = notification.querySelector('.vbc-notification-dismiss');
      dismissBtn?.addEventListener('click', e => {
        e.stopPropagation();
        this.dismissNotification(notification);
      });
    }

    if (onClick) {
      notification.style.cursor = 'pointer';
      notification.addEventListener('click', onClick);
    }

    // Add to DOM and animate in
    this.container!.appendChild(notification);
    this.notifications.add(notification);

    // Trigger show animation
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });

    // Auto-dismiss if duration is set
    if (duration > 0) {
      setTimeout(() => {
        this.dismissNotification(notification);
      }, duration);
    }

    return notification;
  }

  /**
   * Convenience methods for different notification types
   */
  public success(message: string, options: Omit<NotificationOptions, 'type'> = {}): HTMLElement {
    return this.show(message, { ...options, type: 'success' });
  }

  public error(message: string, options: Omit<NotificationOptions, 'type'> = {}): HTMLElement {
    return this.show(message, { ...options, type: 'error' });
  }

  public warning(message: string, options: Omit<NotificationOptions, 'type'> = {}): HTMLElement {
    return this.show(message, { ...options, type: 'warning' });
  }

  public info(message: string, options: Omit<NotificationOptions, 'type'> = {}): HTMLElement {
    return this.show(message, { ...options, type: 'info' });
  }

  /**
   * Dismiss all notifications
   */
  public dismissAll(): void {
    Array.from(this.notifications).forEach(notification => {
      this.dismissNotification(notification);
    });
  }

  /**
   * Update configuration
   */
  public configure(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Destroy the notification system
   */
  public destroy(): void {
    this.dismissAll();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.notifications.clear();

    const styles = document.getElementById('notification-system-styles');
    if (styles && styles.parentNode) {
      styles.parentNode.removeChild(styles);
    }
  }
}

// Create and export a global instance
export const notifications = new NotificationSystem();

// Export individual methods for convenience
export const showNotification = notifications.show.bind(notifications);
export const showSuccess = notifications.success.bind(notifications);
export const showError = notifications.error.bind(notifications);
export const showWarning = notifications.warning.bind(notifications);
export const showInfo = notifications.info.bind(notifications);

// For backward compatibility, export the old function signature
export function showNotificationLegacy(message: string, type: 'success' | 'error' | 'info'): void {
  notifications.show(message, { type });
}

export default notifications;
