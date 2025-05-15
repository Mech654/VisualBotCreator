import { enterTransition, exitTransition } from './transitions';

export function showNotification(message: string, type: 'success' | 'error' | 'info'): void {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  enterTransition(notification, 'slide-up', 300);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    exitTransition(notification, 'slide-up', 300).then(() => {
      notification.remove();
    });
  }, 3000);
}
