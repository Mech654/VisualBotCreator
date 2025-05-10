import '../scss/index.scss';
import { showPageTransition } from './ui/transitions';
declare const module: any;

interface ActionItem {
  icon: string;
  text: string;
  action: string;
  danger?: boolean;
}

// Remove js-loading class when CSS is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Remove js-loading class to fade in content
  document.body.classList.remove('js-loading');

  document.querySelectorAll('.bot-action').forEach(action => {
    action.addEventListener('click', e => {
      e.stopPropagation();

      document.querySelectorAll('.action-dropdown').forEach(dropdown => dropdown.remove());

      const dropdown = document.createElement('div');
      dropdown.className = 'action-dropdown';

      const actions: ActionItem[] = [
        { icon: '✏️', text: 'Edit', action: 'edit' },
        { icon: '🔄', text: 'Duplicate', action: 'duplicate' },
        { icon: '⚙️', text: 'Settings', action: 'settings' },
        { icon: '🗑️', text: 'Delete', action: 'delete', danger: true },
      ];

      actions.forEach(item => {
        const actionItem = document.createElement('div');
        actionItem.className = 'dropdown-item';
        if (item.danger) actionItem.classList.add('danger');

        actionItem.innerHTML = `<span class="dropdown-icon">${item.icon}</span>${item.text}`;

        actionItem.addEventListener('click', () => {
          const target = e.target as HTMLElement;
          const botCard = target.closest('.bot-card') as HTMLElement;
          handleBotAction(item.action, botCard);
          dropdown.remove();
        });

        dropdown.appendChild(actionItem);
      });

      (action as HTMLElement).appendChild(dropdown);

      document.addEventListener('click', function closeDropdown(evt) {
        const target = evt.target as HTMLElement;
        if (!target.closest('.bot-action')) {
          dropdown.remove();
          document.removeEventListener('click', closeDropdown);
        }
      });
    });
  });

  function handleBotAction(action: string, botCard: HTMLElement): void {
    const botNameElement = botCard.querySelector('.bot-name');
    const botName = botNameElement ? botNameElement.textContent || 'Bot' : 'Bot';

    switch (action) {
      case 'edit':
        showPageTransition('builder.html');
        break;

      case 'duplicate':
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `<span>✅</span> Bot "${botName}" duplicated successfully!`;
        document.body.appendChild(notification);

        setTimeout(() => {
          notification.classList.add('fade-out');
          setTimeout(() => notification.remove(), 300);
        }, 3000);
        break;

      case 'settings':
        const statusDot = botCard.querySelector('.status-dot');
        const statusText = botCard.querySelector('.bot-status');

        if (statusDot && statusText) {
          if (statusDot.classList.contains('status-active')) {
            statusDot.classList.remove('status-active');
            statusDot.classList.add('status-offline');
            statusText.innerHTML = '<div class="status-dot status-offline"></div>Offline';
          } else {
            statusDot.classList.remove('status-offline');
            statusDot.classList.add('status-active');
            statusText.innerHTML = '<div class="status-dot status-active"></div>Active';
          }
        }
        break;

      case 'delete':
        const dialogElement = document.createElement('div');
        dialogElement.className = 'confirmation-dialog';
        dialogElement.innerHTML = `
          <div class="dialog-content">
            <h3>Delete Bot</h3>
            <p>Are you sure you want to delete "${botName}"? This action cannot be undone.</p>
            <div class="dialog-actions">
              <button class="btn btn-outline dialog-cancel">Cancel</button>
              <button class="btn btn-danger dialog-confirm">Delete</button>
            </div>
          </div>
        `;

        document.body.appendChild(dialogElement);

        setTimeout(() => dialogElement.classList.add('active'), 10);

        const cancelButton = dialogElement.querySelector('.dialog-cancel');
        if (cancelButton) {
          cancelButton.addEventListener('click', () => {
            dialogElement.classList.remove('active');
            setTimeout(() => dialogElement.remove(), 300);
          });
        }

        const confirmButton = dialogElement.querySelector('.dialog-confirm');
        if (confirmButton) {
          confirmButton.addEventListener('click', () => {
            botCard.style.height = `${botCard.offsetHeight}px`;
            botCard.classList.add('fade-out');

            setTimeout(() => {
              botCard.style.height = '0px';
              botCard.style.margin = '0px';
              botCard.style.padding = '0px';
              botCard.style.overflow = 'hidden';

              setTimeout(() => {
                botCard.remove();

                const countElement = document.querySelector('.section-title > span');
                if (countElement && countElement.textContent) {
                  const currentCount = parseInt(countElement.textContent);
                  countElement.textContent = `${currentCount - 1} bots`;

                  if (currentCount - 1 === 0) {
                    const botList = document.querySelector('.bot-list') as HTMLElement;
                    const emptyState = document.querySelector('.empty-state') as HTMLElement;

                    if (botList) botList.style.display = 'none';
                    if (emptyState) emptyState.style.display = 'flex';
                  }
                }
              }, 300);
            }, 10);

            dialogElement.classList.remove('active');
            setTimeout(() => dialogElement.remove(), 300);
          });
        }
        break;
    }
  }

  const createButton = document.querySelector('.btn-primary');
  createButton?.addEventListener('click', () => {
    showPageTransition('builder.html');
  });

  document.querySelectorAll('.schema-card').forEach(card => {
    card.addEventListener('click', () => {
      showPageTransition('builder.html');
    });
  });

  document.querySelectorAll('.bot-card').forEach(card => {
    card.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      if (!target.closest('.bot-action')) {
        showPageTransition('builder.html');
      }
    });
  });

  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', e => {
      const menuItem = e.currentTarget as HTMLElement;
      const isActive = menuItem.classList.contains('active');
      const itemText = menuItem.innerText || '';

      if (!isActive && itemText.includes('Bot Builder')) {
        showPageTransition('builder.html');
      }
    });
  });
});

if (module && module.hot) {
  module.hot.accept();
}
