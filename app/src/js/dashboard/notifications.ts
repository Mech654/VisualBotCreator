// Dashboard-specific notification utilities
import { notifications } from '../shared/notifications.js';

// Configure notifications for dashboard
notifications.configure({
  defaultPosition: 'top-right',
  defaultDuration: 4000,
  maxNotifications: 3,
});

// Dashboard notification functions
export function showDashboardNotification(
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info'
): HTMLElement {
  return notifications.show(message, {
    type,
    position: 'top-right',
    dismissible: true,
  });
}

export function showBotDuplicatedNotification(botName: string): HTMLElement {
  return notifications.success(`Bot "${botName}" duplicated successfully!`, {
    icon: '✅',
    duration: 3000,
  });
}

export function showBotDeletedNotification(botName: string): HTMLElement {
  return notifications.error(`Bot "${botName}" deleted`, {
    icon: '🗑️',
    duration: 3000,
  });
}

export function showBotStatusChangedNotification(botName: string, isActive: boolean): HTMLElement {
  const status = isActive ? 'activated' : 'deactivated';
  const icon = isActive ? '✅' : '⏹️';
  const type = isActive ? 'success' : 'warning';

  return notifications.show(`Bot "${botName}" ${status}`, {
    type,
    icon,
    duration: 2500,
  });
}

export function showErrorNotification(message: string): HTMLElement {
  return notifications.error(message, {
    icon: '❌',
    duration: 5000,
    dismissible: true,
  });
}

export function showSaveNotification(message: string = 'Changes saved successfully'): HTMLElement {
  return notifications.success(message, {
    icon: '💾',
    duration: 2000,
  });
}

// Legacy compatibility function
export function createLegacyNotification(
  message: string,
  type: 'success' | 'error' | 'warning' = 'success'
): HTMLElement {
  return showDashboardNotification(message, type);
}

// Modern notification functions
export const showNotification = notifications.show.bind(notifications);
export const showSuccess = notifications.success.bind(notifications);
export const showError = notifications.error.bind(notifications);
export const showWarning = notifications.warning.bind(notifications);
export const showInfo = notifications.info.bind(notifications);

export { notifications };
export default notifications;
