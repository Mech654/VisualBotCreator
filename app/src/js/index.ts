import '../scss/index.scss';
import { showPageTransition } from './builder/utils/transitions';
import { setupSwalDashboardModalStyle } from './dashboard/swal-setup';
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
          const botId = botName; // Using botName as botId as per existing code
          const sanitizedBotId = botId.replace(/[^a-zA-Z0-9\-_]/g, '_'); // Sanitize for DOM IDs

          let initialRunConditions: { Key: string; Value: string }[] = [];
          if (window.database && typeof window.database.getRunConditions === 'function') {
            try {
              initialRunConditions = await window.database.getRunConditions(botId);
            } catch (err) {
              console.error(`Failed to get run conditions for ${botId}:`, err);
              initialRunConditions = [];
            }
          }

          // Mutable copy for this modal instance
          let currentRunConditions = [...initialRunConditions];

          const runConditionsListContainerId = `swal-rc-list-container-${sanitizedBotId}`;
          const addRunConditionBtnId = `swal-add-rc-btn-${sanitizedBotId}`;
          const addRunConditionFormId = `swal-add-rc-form-${sanitizedBotId}`;
          const rcKeySelectId = `swal-rc-key-select-${sanitizedBotId}`;
          const rcValueInputId = `swal-rc-value-input-${sanitizedBotId}`;
          const saveRcBtnId = `swal-save-rc-btn-${sanitizedBotId}`;
          const cancelRcBtnId = `swal-cancel-rc-btn-${sanitizedBotId}`;

          const renderRunConditionsToList = (conditions: { Key: string; Value: string }[]) => {
            let listHtml = '<ol class="swal-rc-list">';
            if (conditions.length > 0) {
              conditions.forEach((rc, index) => {
                let prettyValue = rc.Value;
                // Enhance display for common types
                if (rc.Key === 'Time of Day (HH:MM)') {
                  prettyValue = `<span style='color:#4fc3f7;'>${rc.Value}</span>`; // blue accent
                } else if (rc.Key === 'Day of Week') {
                  prettyValue = `<span style='color:#81c784;'>${rc.Value}</span>`; // green accent
                } else if (rc.Key === 'Specific Date (YYYY-MM-DD)') {
                  prettyValue = `<span style='color:#ffb74d;'>${rc.Value}</span>`; // orange accent
                } else if (rc.Key.startsWith('Variable')) {
                  prettyValue = `<span style='color:#ba68c8;'>${rc.Value}</span>`; // purple accent
                } else if (rc.Key === 'Bot Enabled') {
                  prettyValue = `<span style='color:#baffc9;'>${rc.Value}</span>`;
                } else if (rc.Key === 'User Input') {
                  prettyValue = `<span style='color:#e0e0e0;'>${rc.Value}</span>`;
                } else if (rc.Key === 'Random Chance') {
                  prettyValue = `<span style='color:#e0e0e0;'>${rc.Value}%</span>`;
                }
                listHtml += `<li><span><b>${rc.Key}:</b> ${prettyValue}</span> <button class="swal-delete-rc-btn" data-index="${index}">&times;</button></li>`;
              });
            } else {
              listHtml += '<li class="swal-rc-no-conditions"><i>No run conditions set.</i></li>';
            }
            listHtml += '</ol>';
            return listHtml;
          };

          const initialRunCondHtmlForSwal = renderRunConditionsToList(currentRunConditions);

          if (window.Swal) {
            window.Swal.fire({
              title: `<span style='font-size:2em;'>${botName}</span>`,
              html: `
                <div class='swal-bot-details-grid'>
                  <div class='swal-detail-category'>
                    <div class='swal-category-title'>General Information</div>
                    <div class='swal-detail-item'>
                      <b>Name:</b> 
                      <input type="text" id="swal-bot-name-input-${sanitizedBotId}" value="${botName}" class="swal-inline-input">
                    </div>
                    <div class='swal-detail-item'>
                      <b>Description:</b> 
                      <input type="text" id="swal-bot-description-input-${sanitizedBotId}" value="${botDescription}" class="swal-inline-input">
                    </div>
                  </div>

                  <div class='swal-detail-category'>
                    <div class='swal-category-title'>Operational Status</div>
                    <div class='swal-detail-item'>
                      <b>Status:</b> <span id='swal-bot-status' style='font-weight:bold;'>${botStatus}</span>
                      <button id='swal-toggle-btn' style='margin-left:10px;padding:4px 18px;font-size:1.1em;border-radius:18px;border:1px solid #888;background:${botStatus === 'Active' ? '#4caf50' : '#ccc'};color:#fff;cursor:pointer;min-width:60px;'>${botStatus === 'Active' ? 'On' : 'Off'}</button>
                    </div>
                    <div class='swal-detail-item'><b>Stats:</b> <span style='font-size:1.1em;'>${botStats}</span></div>
                  </div>

                  <div class='swal-detail-category'>
                    <div class='swal-category-header'>
                      <div class='swal-category-title'>Run Conditions</div>
                      <button id='${addRunConditionBtnId}' class='swal-add-rc-btn'></button>
                    </div>
                    <div class='swal-detail-item' id='${runConditionsListContainerId}'>
                      ${initialRunCondHtmlForSwal}
                    </div>
                    <div id='${addRunConditionFormId}' class='swal-add-rc-form' style='display:none;'>
                      <h4 class='swal-add-rc-title'>New Run Condition</h4>
                      <select id='${rcKeySelectId}' class='swal-rc-select'>
                        <option value="">-- Select Type --</option>
                        <option value="Time of Day (HH:MM)">Time of Day (HH:MM)</option>
                        <option value="Day of Week">Day of Week</option>
                        <option value="Specific Date (YYYY-MM-DD)">Specific Date (YYYY-MM-DD)</option>
                      </select>
                      <input type="text" id='${rcValueInputId}' class='swal-rc-input' placeholder="Condition Value">
                      <div id='swal-date-time-extra-${sanitizedBotId}' style="display:none; margin-top:8px;">
                        <input type="text" id='swal-date-hour-${sanitizedBotId}' class='swal-rc-input' style="width:48%;display:inline-block;margin-right:2%;" placeholder="Hour (00-23, optional)">
                        <input type="text" id='swal-date-minute-${sanitizedBotId}' class='swal-rc-input' style="width:48%;display:inline-block;" placeholder="Minute (00-59, optional)">
                      </div>
                      <div class='swal-rc-form-actions'>
                        <button id='${saveRcBtnId}' class='swal-save-rc-btn'>Save</button>
                        <button id='${cancelRcBtnId}' class='swal-cancel-rc-btn'>Cancel</button>
                      </div>
                    </div>
                  </div>
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

                // Run Condition interactivity
                const listContainer = document.getElementById(runConditionsListContainerId) as HTMLElement;
                const addBtn = document.getElementById(addRunConditionBtnId) as HTMLButtonElement;
                const addForm = document.getElementById(addRunConditionFormId) as HTMLElement;
                const keySelect = document.getElementById(rcKeySelectId) as HTMLSelectElement;
                const valueInput = document.getElementById(rcValueInputId) as HTMLInputElement;
                const saveBtn = document.getElementById(saveRcBtnId) as HTMLButtonElement;
                const cancelBtn = document.getElementById(cancelRcBtnId) as HTMLButtonElement;

                const updateAndRenderList = () => {
                  if (listContainer) {
                    listContainer.innerHTML = renderRunConditionsToList(currentRunConditions);
                    attachDeleteListeners(); // Re-attach delete listeners after re-render
                  }
                };

                const attachDeleteListeners = () => {
                  listContainer.querySelectorAll('.swal-delete-rc-btn').forEach(btn => {
                    btn.addEventListener('click', (ev) => {
                      const index = parseInt((ev.currentTarget as HTMLElement).dataset.index || '-1');
                      if (index > -1 && index < currentRunConditions.length) {
                        currentRunConditions.splice(index, 1);
                        // In a real app, you would call: await window.database.deleteRunCondition(botId, currentRunConditions[index]);
                        updateAndRenderList();
                      }
                    });
                  });
                };

                if (addBtn) {
                  addBtn.addEventListener('click', () => {
                    if (addForm) addForm.style.display = 'block';
                    addBtn.style.display = 'none';
                  });
                }

                if (cancelBtn) {
                  cancelBtn.addEventListener('click', () => {
                    if (addForm) addForm.style.display = 'none';
                    if (addBtn) addBtn.style.display = 'inline-block';
                    if (keySelect) keySelect.value = '';
                    if (valueInput) valueInput.value = '';
                  });
                }

                if (saveBtn) {
                  saveBtn.addEventListener('click', async () => {
                    const key = keySelect.value;
                    const value = valueInput.value;
                    // Validation for each type
                    let valid = true;
                    let errorMsg = '';
                    if (!key || value.trim() === '') {
                      valid = false;
                      errorMsg = 'Please select a condition type and enter a value.';
                    } else if (key === 'Time of Day (HH:MM)') {
                      valid = /^([01]?\d|2[0-3]):[0-5]\d$/.test(value.trim());
                      if (!valid) errorMsg = 'Please enter a valid time in HH:MM format.';
                    } else if (key === 'Specific Date (YYYY-MM-DD)') {
                      valid = /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
                      if (!valid) errorMsg = 'Please enter a valid date in YYYY-MM-DD format.';
                      // Optionally validate hour/minute if provided
                      const hourInput = document.getElementById(`swal-date-hour-${sanitizedBotId}`) as HTMLInputElement;
                      const minuteInput = document.getElementById(`swal-date-minute-${sanitizedBotId}`) as HTMLInputElement;
                      let hour = hourInput ? hourInput.value.trim() : '';
                      let minute = minuteInput ? minuteInput.value.trim() : '';
                      if (hour && !/^([01]?\d|2[0-3])$/.test(hour)) {
                        valid = false;
                        errorMsg = 'Hour must be 00-23 if provided.';
                      }
                      if (minute && !/^([0-5]?\d)$/.test(minute)) {
                        valid = false;
                        errorMsg = 'Minute must be 00-59 if provided.';
                      }
                      // If valid, append hour/minute to value for storage
                      if (valid && (hour || minute)) {
                        let dateVal = value.trim();
                        if (hour) dateVal += ` ${hour.padStart(2,'0')}`;
                        if (minute) dateVal += `:${minute.padStart(2,'0')}`;
                        valueInput.value = dateVal;
                      }
                    } else if (key.startsWith('Variable')) {
                      // Require format: variableName=value or variableName>value, etc.
                      valid = /.+[=><!].+/.test(value.trim());
                      if (!valid) errorMsg = 'Format: variableName=value (or >, <, !=)';
                    }

                    if (valid) {
                      currentRunConditions.push({ Key: key, Value: value });
                      updateAndRenderList();
                      if (keySelect) keySelect.value = '';
                      if (valueInput) valueInput.value = '';
                      if (addForm) addForm.style.display = 'none';
                      if (addBtn) addBtn.style.display = 'inline-block';
                    } else {
                      alert(errorMsg);
                    }
                  });
                }

                // Show/hide hour and minute inputs based on selected condition type
                const dateTimeExtraContainer = document.getElementById(`swal-date-time-extra-${sanitizedBotId}`);
                if (keySelect && dateTimeExtraContainer) {
                  keySelect.addEventListener('change', () => {
                    const extra = document.getElementById(`swal-date-time-extra-${sanitizedBotId}`);
                    if (keySelect.value === 'Specific Date (YYYY-MM-DD)') {
                      if (extra) extra.style.display = '';
                    } else {
                      if (extra) extra.style.display = 'none';
                    }
                  });
                }
              }
            });
          }
        });
      }); // Corrected: Added missing closing parenthesis and semicolon for forEach
    }
  }

  // Initial setup for SweetAlert2 styles
  setupSwalDashboardModalStyle();
});
