// Updated notification utilities using the shared notification system
import { notifications } from '../../shared/notifications.js';

// Backward compatible function with original signature
export function showNotification(message: string, type: 'success' | 'error' | 'info'): void {
  notifications.show(message, { type });
}

// Modern notification functions
export const showSuccess = notifications.success.bind(notifications);
export const showError = notifications.error.bind(notifications);
export const showWarning = notifications.warning.bind(notifications);
export const showInfo = notifications.info.bind(notifications);

// Legacy function for backward compatibility
export function showNotificationLegacy(message: string, type: 'success' | 'error' | 'info'): void {
  notifications.show(message, { type });
}

export { notifications };
export default notifications;
