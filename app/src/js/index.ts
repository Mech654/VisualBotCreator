import '../scss/index.scss';
import { showPageTransition } from './builder/utils/transitions';
declare const module: any;

interface ActionItem {
  icon: string;
  text: string;
  action: string;
  danger?: boolean;
}

// Add a type for the database API to the global Window interface
interface Bot {
  Id: string;
  CreatedAt: string;
  UpdatedAt: string;
  enabled: number;
  description: string;
  run_success_count: number;
  run_failure_count: number;
}

declare global {
  interface Window {
    database?: {
      getAllBots: () => Promise<Bot[]>;
      getRunConditions: (botId: string) => Promise<{ Key: string; Value: string }[]>;
      setBotEnabled: (botId: string, enabled: boolean) => Promise<void>;
    };
  }
}

// Remove js-loading class when CSS is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Remove js-loading class to fade in content
  document.body.classList.remove('js-loading');

  // Fetch bots from the database and render them
  const botList = document.querySelector('.bot-list') as HTMLElement | null;
  const emptyState = document.querySelector('.empty-state') as HTMLElement | null;
  const countElement = document.querySelector('.section-subtitle') as HTMLElement | null;

  if (window.database && typeof window.database.getAllBots === 'function') {
    try {
      const bots = await window.database.getAllBots();
      if (botList) botList.innerHTML = '';
      if (bots.length === 0) {
        if (botList) botList.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        if (countElement) countElement.textContent = '0 bots';
      } else {
        if (botList) botList.style.display = '';
        if (emptyState) emptyState.style.display = 'none';
        if (countElement) countElement.textContent = `${bots.length} bot${bots.length === 1 ? '' : 's'}`;
        bots.forEach((bot: Bot) => {
          if (!botList) return;
          const card = document.createElement('div');
          card.className = 'bot-card';
          card.innerHTML = `
            <div class="bot-header">
              <div class="bot-icon">${(bot.Id || '??').substring(0, 2).toUpperCase()}</div>
              <div class="bot-info">
                <h3 class="bot-name text-primary">${bot.Id || 'Unnamed Bot'}</h3>
                <div class="bot-type text-secondary">${bot.description || ''}</div>
              </div>
              <div class="bot-actions">
                <div class="bot-action dropdown-trigger">⋮</div>
              </div>
            </div>
            <div class="bot-details text-secondary">
              <p class="bot-description">${bot.description || ''}</p>
            </div>
            <div class="bot-footer text-secondary">
              <div class="bot-status">
                <div class="status-dot ${bot.enabled ? 'status-active' : 'status-offline'}"></div>
                <span class="status-text">${bot.enabled ? 'Active' : 'Offline'}</span>
              </div>
              <div class="bot-last-edit">Last edited: ${bot.UpdatedAt ? new Date(bot.UpdatedAt).toLocaleDateString() : ''}</div>
              <div class="bot-stats">Success: ${bot.run_success_count || 0} | Fail: ${bot.run_failure_count || 0}</div>
            </div>
          `;
          botList.appendChild(card);
        });
        // Attach listeners after rendering
        attachBotCardListeners();
      }
    } catch (err) {
      console.error('Failed to load bots:', err);
    }
  }

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

  function attachBotCardListeners() {
    const botList = document.querySelector('.bot-list');
    if (botList) {
      botList.querySelectorAll('.bot-card').forEach(card => {
        card.addEventListener('click', async e => {
          const target = e.target as HTMLElement;
          if (target.closest('.bot-action')) return;
          const botName = card.querySelector('.bot-name')?.textContent || 'Bot';
          const botType = card.querySelector('.bot-type')?.textContent || '';
          const botDescription = card.querySelector('.bot-description')?.textContent || '';
          const botStatus = card.querySelector('.status-text')?.textContent || '';
          const botStats = card.querySelector('.bot-stats')?.textContent || '';
          const botId = botName;
          let runConditions: { Key: string; Value: string }[] = [];
          if (window.database && typeof window.database.getRunConditions === 'function') {
            try {
              runConditions = await window.database.getRunConditions(botId);
            } catch (err) {
              runConditions = [];
            }
          }
          const runCondHtml = runConditions.length
            ? `<ul style='margin:0 0 10px 0;padding-left:20px;'>${runConditions.map(rc => `<li><b>${rc.Key}:</b> ${rc.Value}</li>`).join('')}</ul>`
            : '<i>No run conditions set.</i>';
          if (window.Swal) {
            window.Swal.fire({
              title: `<span style='font-size:2em;'>${botName}</span>`,
              html: `
                <div style='text-align:left;font-size:1.25em;max-width:700px;padding:16px 0;'>
                  <div style='margin-bottom:12px;'><b>Type:</b> <span style='font-size:1.1em;'>${botType}</span></div>
                  <div style='margin-bottom:12px;'><b>Description:</b> <span style='font-size:1.1em;'>${botDescription}</span></div>
                  <div style='margin-bottom:12px;'><b>Status:</b> <span id='swal-bot-status' style='font-weight:bold;'>${botStatus}</span> 
                    <button id='swal-toggle-btn' style='margin-left:10px;padding:4px 18px;font-size:1.1em;border-radius:18px;border:1px solid #888;background:${botStatus==='Active'?'#4caf50':'#ccc'};color:#fff;cursor:pointer;min-width:60px;'>${botStatus==='Active'?'On':'Off'}</button>
                  </div>
                  <div style='margin-bottom:12px;'><b>Stats:</b> <span style='font-size:1.1em;'>${botStats}</span></div>
                  <div style='margin-bottom:12px;'><b>Run Conditions:</b><br>${runCondHtml}</div>
                </div>
              `,
              showCloseButton: true,
              showCancelButton: false,
              confirmButtonText: 'OK',
              width: 700,
              customClass: {
                popup: 'swal2-dashboard-bot-modal'
              },
              didOpen: () => {
                const toggleBtn = document.getElementById('swal-toggle-btn');
                const statusSpan = document.getElementById('swal-bot-status');
                if (toggleBtn && statusSpan) {
                  toggleBtn.addEventListener('click', async () => {
                    const isActive = statusSpan.textContent === 'Active';
                    statusSpan.textContent = isActive ? 'Offline' : 'Active';
                    toggleBtn.textContent = isActive ? 'Off' : 'On';
                    toggleBtn.style.background = isActive ? '#ccc' : '#4caf50';
                    if (window.database && typeof window.database.setBotEnabled === 'function') {
                      await window.database.setBotEnabled(botId, !isActive);
                    }
                  });
                }
              }
            });
          } else {
            alert(`${botName}\nType: ${botType}\nDescription: ${botDescription}\nStatus: ${botStatus}\nStats: ${botStats}`);
          }
        });
      });
    }
  }

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

  // Add custom SweetAlert2 CSS for dashboard bot modal
  const swalStyle = document.createElement('style');
  swalStyle.innerHTML = `
  .swal2-dashboard-bot-modal {
    font-size: 1.25em !important;
    max-width: 700px !important;
    padding: 32px 32px 24px 32px !important;
    border-radius: 18px !important;
    background: #23272e !important;
    color: #f3f3f3 !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  }
  .swal2-dashboard-bot-modal .swal2-title {
    font-size: 2.2em !important;
    margin-bottom: 0.5em !important;
    color: #fff !important;
  }
  .swal2-dashboard-bot-modal b {
    color: #4cafef;
  }
  .swal2-dashboard-bot-modal ul {
    margin: 0.5em 0 0.5em 0.5em;
    padding-left: 1.5em;
  }
  .swal2-dashboard-bot-modal #swal-toggle-btn {
    font-size: 1.1em;
    border-radius: 18px;
    border: 1px solid #888;
    min-width: 70px;
    font-weight: bold;
    transition: background 0.2s;
  }
  .swal2-dashboard-bot-modal #swal-toggle-btn[style*='#4caf50'] {
    background: #4caf50 !important;
    color: #fff !important;
  }
  .swal2-dashboard-bot-modal #swal-toggle-btn[style*='#ccc'] {
    background: #ccc !important;
    color: #222 !important;
  }
  `;
  document.head.appendChild(swalStyle);
});

if (module && module.hot) {
  module.hot.accept();
}
