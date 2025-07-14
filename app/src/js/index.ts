import { showPageTransition } from './builder/utils/transitions.js';
import { setupSwalDashboardModalStyle } from './dashboard/swal-setup.js';
declare const module: any;

interface ActionItem {
  icon: string;
  text: string;
  action: string;
  danger?: boolean;
}

document.addEventListener('DOMContentLoaded', async () => {
  document.body.classList.remove('js-loading');

  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.getAttribute('data-page');
      if (page) {
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        if (page === 'builder') {
          showPageTransition('builder.html');
        } else if (page === 'dashboard') {
          showPageTransition('index.html');
        }
      }
    });
  });

  const botList = document.querySelector('.bot-list') as HTMLElement;
  const emptyState = document.querySelector('.empty-state') as HTMLElement;
  const countElement = document.querySelector('.section-subtitle');

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
        if (countElement)
          countElement.textContent = `${bots.length} bot${bots.length === 1 ? '' : 's'}`;
        bots.forEach((bot: Bot) => {
          console.log(
            `[INDEX] Bot data for card: Id=${bot.Id}, Name=${bot.Name}, Raw: ${JSON.stringify(bot)}`
          );

          if (!botList) return;
          const card = document.createElement('div');
          card.className = 'bot-card';
          card.dataset.botId = bot.Id;
          card.innerHTML = `
            <div class="bot-header">
              <div class="bot-icon">${(bot.Id || '??').substring(0, 2).toUpperCase()}</div>
              <div class="bot-info">
                <h3 class="bot-name text-primary" data-bot-id="${bot.Id}">${bot.Id}</h3>
                <div class="bot-type text-secondary" data-bot-id="${bot.Id}">${bot.description || ''}</div>
              </div>
              <div class="bot-actions">
                <div class="bot-action dropdown-trigger">⋮</div>
              </div>
            </div>
            <div class="bot-details text-secondary">
              <p class="bot-description" data-bot-id="${bot.Id}">${bot.description || ''}</p>
            </div>
            <div class="bot-footer text-secondary">
              <div class="bot-status" data-bot-id="${bot.Id}">
                <div class="status-dot ${bot.enabled ? 'status-active' : 'status-offline'}"></div>
                <span class="status-text">${bot.enabled ? 'Active' : 'Offline'}</span>
              </div>
              <div class="bot-last-edit">Last edited: ${bot.UpdatedAt ? new Date(bot.UpdatedAt).toLocaleDateString() : ''}</div>
              <div class="bot-stats">Success: ${bot.run_success_count || 0} | Fail: ${bot.run_failure_count || 0}</div>
            </div>
          `;
          botList.appendChild(card);
        });
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
        { icon: '<i class="bi bi-pencil-fill"></i>', text: 'Edit', action: 'edit' },
        { icon: '<i class="bi bi-files"></i>', text: 'Duplicate', action: 'duplicate' },
        { icon: '<i class="bi bi-gear-fill"></i>', text: 'Settings', action: 'settings' },
        { icon: '<i class="bi bi-trash-fill"></i>', text: 'Delete', action: 'delete', danger: true },
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

  const mainCreateButton = document.querySelector(
    '.empty-state .btn-primary, .section-header .btn-primary'
  );
  mainCreateButton?.addEventListener('click', () => {
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

          const botCardElement = card as HTMLElement;
          const actualBotId = botCardElement.dataset.botId;

          if (!actualBotId) {
            console.error('[INDEX] Could not find actual bot ID for card:', card);
            return;
          }

          const botNameElement = card.querySelector('.bot-name');
          const botDescriptionElement = card.querySelector('.bot-description');
          const botDescription = botDescriptionElement?.textContent || '';
          const botStatus = card.querySelector('.status-text')?.textContent || '';
          const botStats = card.querySelector('.bot-stats')?.textContent || '';

          const sanitizedBotIdForDOM = actualBotId.replace(/[^a-zA-Z0-9\\-_]/g, '_');

          let initialRunConditions: { Key: string; Value: string }[] = [];
          if (window.database && typeof window.database.getRunConditions === 'function') {
            try {
              initialRunConditions = await window.database.getRunConditions(actualBotId);
            } catch (err) {
              console.error(`Failed to get run conditions for ${actualBotId}:`, err);
              initialRunConditions = [];
            }
          }

          const currentRunConditions = [...initialRunConditions];
          const runConditionsListContainerId = `swal-rc-list-container-${sanitizedBotIdForDOM}`;
          const addRunConditionBtnId = `swal-add-rc-btn-${sanitizedBotIdForDOM}`;
          const addRunConditionFormId = `swal-add-rc-form-${sanitizedBotIdForDOM}`;
          const rcKeySelectId = `swal-rc-key-select-${sanitizedBotIdForDOM}`;
          const rcValueInputId = `swal-rc-value-input-${sanitizedBotIdForDOM}`;
          const saveRcBtnId = `swal-save-rc-btn-${sanitizedBotIdForDOM}`;
          const cancelRcBtnId = `swal-cancel-rc-btn-${sanitizedBotIdForDOM}`;

          const renderRunConditionsToList = (conditions: { Key: string; Value: string }[]) => {
            let listHtml = '<ol class="swal-rc-list">';
            if (conditions.length > 0) {
              conditions.forEach((rc, index) => {
                let prettyValue = rc.Value;
                if (rc.Key === 'Time of Day (HH:MM)')
                  prettyValue = `<span style='color:#4fc3f7;'>${rc.Value}</span>`;
                else if (rc.Key === 'Day of Week')
                  prettyValue = `<span style='color:#81c784;'>${rc.Value}</span>`;
                else if (rc.Key === 'Specific Date (YYYY-MM-DD)')
                  prettyValue = `<span style='color:#ffb74d;'>${rc.Value}</span>`;
                else if (rc.Key.startsWith('Variable'))
                  prettyValue = `<span style='color:#ba68c8;'>${rc.Value}</span>`;
                else if (rc.Key === 'Bot Enabled')
                  prettyValue = `<span style='color:#baffc9;'>${rc.Value}</span>`;
                else if (rc.Key === 'User Input')
                  prettyValue = `<span style='color:#e0e0e0;'>${rc.Value}</span>`;
                else if (rc.Key === 'Random Chance')
                  prettyValue = `<span style='color:#e0e0e0;'>${rc.Value}%</span>`;
                listHtml += `<li><span><b>${rc.Key}:</b> ${prettyValue}</span> <button class="swal-delete-rc-btn" data-index="${index}">&times;</button></li>`;
              });
            } else {
              listHtml += '<li class="swal-rc-no-conditions"><i>No run conditions set.</i></li>';
            }
            listHtml += '</ol>';
            return listHtml;
          };

          const initialRunCondHtmlForSwal = renderRunConditionsToList(currentRunConditions);

          let initialModalIdForSwalDisplay: string = actualBotId;
          let currentCommittedId: string = initialModalIdForSwalDisplay || '';

          window.Swal.fire({
            title: `<span style='font-size:2em;'>${initialModalIdForSwalDisplay}</span>`,
            html: `
              <div class='swal-bot-details-grid'>
                <div class='swal-detail-category'>
                  <div class='swal-category-title'>General Information</div>
                  <div class='swal-detail-item'>
                    <b>Identifier (ID):</b> 
                    <input type="text" id="swal-bot-name-input-${sanitizedBotIdForDOM}" value="${initialModalIdForSwalDisplay}" class="swal-inline-input">
                  </div>
                  <div class='swal-detail-item'>
                    <b>Description:</b> 
                    <input type="text" id="swal-bot-description-input-${sanitizedBotIdForDOM}" value="${botDescription}" class="swal-inline-input">
                  </div>
                </div>

                <div class='swal-detail-category'>
                  <div class='swal-category-title'>Operational Status</div>
                  <div class='swal-detail-item'>
                    <b>Status:</b> <span id='swal-bot-status-${sanitizedBotIdForDOM}' style='font-weight:bold;'>${botStatus}</span>
                    <button id='swal-toggle-btn-${sanitizedBotIdForDOM}' style='margin-left:10px;padding:4px 18px;font-size:1.1em;border-radius:18px;border:1px solid #888;background:${botStatus === 'Active' ? '#4caf50' : '#ccc'};color:#fff;cursor:pointer;min-width:60px;'>${botStatus === 'Active' ? 'On' : 'Off'}</button>
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
                    <div id='swal-date-time-extra-${sanitizedBotIdForDOM}' style="display:none; margin-top:8px;">
                      <input type="text" id='swal-date-hour-${sanitizedBotIdForDOM}' class='swal-rc-input' style="width:48%;display:inline-block;margin-right:2%;" placeholder="Hour (00-23, optional)">
                      <input type="text" id='swal-date-minute-${sanitizedBotIdForDOM}' class='swal-rc-input' style="width:48%;display:inline-block;" placeholder="Minute (00-59, optional)">
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
              popup: 'swal2-dashboard-bot-modal',
            },
            didOpen: () => {
              const nameInput = document.getElementById(
                `swal-bot-name-input-${sanitizedBotIdForDOM}`
              ) as HTMLInputElement;
              const descriptionInput = document.getElementById(
                `swal-bot-description-input-${sanitizedBotIdForDOM}`
              ) as HTMLInputElement;

              let initialDescriptionForModal = descriptionInput.value;

              if (nameInput) {
                nameInput.addEventListener('blur', async () => {
                  const newIdCandidate = nameInput.value.trim();
                  if (!newIdCandidate) {
                    nameInput.value = currentCommittedId;
                    window.Swal.fire('Error', 'ID cannot be empty.', 'error');
                    return;
                  }
                  if (newIdCandidate === currentCommittedId) {
                    return;
                  }

                  console.log(
                    `[INDEX] Attempting to change bot ID from ${currentCommittedId} to ${newIdCandidate}`
                  );
                  if (window.botconfig && typeof window.botconfig.changeName === 'function') {
                    try {
                      const result = await window.botconfig.changeName(
                        currentCommittedId,
                        newIdCandidate
                      );
                      if (result.success) {
                        console.log(`[INDEX] Bot ID successfully changed to ${newIdCandidate}`);

                        // Update UI elements on the card
                        const cardNameElement = document.querySelector(
                          `.bot-name[data-bot-id="${currentCommittedId}"]`
                        );
                        const cardBotIconElement = botCardElement.querySelector('.bot-icon');
                        if (cardNameElement) {
                          cardNameElement.textContent = newIdCandidate;
                          cardNameElement.setAttribute('data-bot-id', newIdCandidate);
                        }
                        if (cardBotIconElement) {
                          cardBotIconElement.textContent = newIdCandidate
                            .substring(0, 2)
                            .toUpperCase();
                        }
                        botCardElement.dataset.botId = newIdCandidate;

                        // Update the modal title
                        const swalTitle = document.querySelector('.swal2-title');
                        if (swalTitle)
                          swalTitle.innerHTML = `<span style='font-size:2em;'>${newIdCandidate}</span>`;

                        currentCommittedId = newIdCandidate;
                        initialModalIdForSwalDisplay = newIdCandidate;
                      } else {
                        nameInput.value = currentCommittedId;
                        window.Swal.fire(
                          'Error',
                          `Failed to change ID: ${result.error || 'Unknown error'}`,
                          'error'
                        );
                      }
                    } catch (err: any) {
                      nameInput.value = currentCommittedId;
                      window.Swal.fire(
                        'Error',
                        `An unexpected error occurred: ${err.message || 'Unknown error'}`,
                        'error'
                      );
                    }
                  } else {
                    nameInput.value = currentCommittedId;
                  }
                });
              }

              if (descriptionInput) {
                descriptionInput.addEventListener('blur', () => {
                  const newDesc = descriptionInput.value.trim();
                  const idForDescChange: string = currentCommittedId;
                  if (newDesc !== initialDescriptionForModal) {
                    initialDescriptionForModal = newDesc;
                    const botDescElementOnCard = document.querySelector(
                      `.bot-description[data-bot-id="${idForDescChange}"]`
                    );
                    if (botDescElementOnCard) botDescElementOnCard.textContent = newDesc;

                    if (
                      window.botconfig &&
                      typeof window.botconfig.changeDescription === 'function'
                    ) {
                      window.botconfig
                        .changeDescription(idForDescChange, newDesc)
                        .then(result => {
                          if (!result.success)
                            console.error('Error saving bot description:', result.error);
                        })
                        .catch(err => console.error('Failed to save bot description:', err));
                    }
                  }
                });
              }

              const toggleBtn = document.getElementById(`swal-toggle-btn-${sanitizedBotIdForDOM}`);
              const statusSpan = document.getElementById(`swal-bot-status-${sanitizedBotIdForDOM}`);
              if (toggleBtn && statusSpan) {
                toggleBtn.addEventListener('click', async () => {
                  const idForStatusChange: string = currentCommittedId;
                  const isActive = statusSpan.textContent === 'Active';
                  statusSpan.textContent = isActive ? 'Offline' : 'Active';
                  toggleBtn.textContent = isActive ? 'Off' : 'On';
                  toggleBtn.style.background = isActive ? '#ccc' : '#4caf50';
                  const cardStatusDot = botCardElement.querySelector('.status-dot');
                  const cardStatusText = botCardElement.querySelector('.status-text');
                  if (cardStatusDot && cardStatusText) {
                    cardStatusDot.classList.toggle('status-active', !isActive);
                    cardStatusDot.classList.toggle('status-offline', isActive);
                    cardStatusText.textContent = isActive ? 'Offline' : 'Active';
                  }
                  if (window.database && typeof window.database.setBotEnabled === 'function') {
                    await window.database.setBotEnabled(idForStatusChange, !isActive);
                  }
                });
              }

              const listContainer = document.getElementById(
                runConditionsListContainerId
              ) as HTMLElement;
              const addBtn = document.getElementById(addRunConditionBtnId) as HTMLButtonElement;
              const addForm = document.getElementById(addRunConditionFormId) as HTMLElement;
              const keySelect = document.getElementById(rcKeySelectId) as HTMLSelectElement;
              const valueInput = document.getElementById(rcValueInputId) as HTMLInputElement;
              const saveBtn = document.getElementById(saveRcBtnId) as HTMLButtonElement;
              const cancelBtn = document.getElementById(cancelRcBtnId) as HTMLButtonElement;

              const updateAndRenderList = () => {
                if (listContainer) {
                  listContainer.innerHTML = renderRunConditionsToList(currentRunConditions);
                  attachDeleteListeners();
                }
              };

              const attachDeleteListeners = () => {
                listContainer.querySelectorAll('.swal-delete-rc-btn').forEach(btn => {
                  btn.addEventListener('click', async ev => {
                    const index = parseInt((ev.currentTarget as HTMLElement).dataset.index || '-1');
                    if (index > -1 && index < currentRunConditions.length) {
                      const conditionToDelete = currentRunConditions[index];
                      currentRunConditions.splice(index, 1);
                      if (
                        window.botconfig &&
                        typeof window.botconfig.deleteCondition === 'function'
                      ) {
                        try {
                          await window.botconfig.deleteCondition(
                            actualBotId,
                            conditionToDelete.Key
                          );
                        } catch (err) {
                          console.error('Error deleting run condition:', err);
                        }
                      }
                      updateAndRenderList();
                    }
                  });
                });
              };
              updateAndRenderList();

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
                  const dateTimeExtraContainer = document.getElementById(
                    `swal-date-time-extra-${sanitizedBotIdForDOM}`
                  );
                  if (dateTimeExtraContainer) dateTimeExtraContainer.style.display = 'none';
                });
              }

              if (saveBtn) {
                saveBtn.addEventListener('click', async () => {
                  const key = keySelect.value;
                  let value = valueInput.value.trim();
                  let valid = true;
                  let errorMsg = '';
                  if (!key || value === '') {
                    valid = false;
                    errorMsg = 'Please select a condition type and enter a value.';
                  } else if (key === 'Time of Day (HH:MM)') {
                    valid = /^([01]?\d|2[0-3]):[0-5]\d$/.test(value);
                    if (!valid) errorMsg = 'Please enter a valid time in HH:MM format.';
                  } else if (key === 'Specific Date (YYYY-MM-DD)') {
                    const datePart = value.split(' ')[0];
                    valid = /^\d{4}-\d{2}-\d{2}$/.test(datePart);
                    if (!valid) errorMsg = 'Please enter a valid date in YYYY-MM-DD format.';
                    const hourInput = document.getElementById(
                      `swal-date-hour-${sanitizedBotIdForDOM}`
                    ) as HTMLInputElement;
                    const minuteInput = document.getElementById(
                      `swal-date-minute-${sanitizedBotIdForDOM}`
                    ) as HTMLInputElement;
                    const hour = hourInput ? hourInput.value.trim() : '';
                    const minute = minuteInput ? minuteInput.value.trim() : '';
                    if (hour && !/^([01]?\d|2[0-3])$/.test(hour)) {
                      valid = false;
                      errorMsg = 'Hour must be 00-23.';
                    }
                    if (minute && !/^([0-5]?\d)$/.test(minute)) {
                      valid = false;
                      errorMsg = 'Minute must be 00-59.';
                    }
                    if (valid && (hour || minute)) {
                      value = datePart;
                      if (hour) value += ` ${hour.padStart(2, '0')}`;
                      if (minute && hour) value += `:${minute.padStart(2, '0')}`;
                      else if (minute && !hour) value += ` 00:${minute.padStart(2, '0')}`;
                    }
                  }

                  if (valid) {
                    const newCondition = { Key: key, Value: value };
                    currentRunConditions.push(newCondition);
                    if (
                      window.botconfig &&
                      typeof window.botconfig.addOrUpdateCondition === 'function'
                    ) {
                      try {
                        await window.botconfig.addOrUpdateCondition(actualBotId, key, value);
                        updateAndRenderList();
                      } catch (err) {
                        console.error('Error saving run condition:', err);
                      }
                    } else {
                      updateAndRenderList();
                    }
                  } else {
                    window.Swal.fire('Invalid Input', errorMsg, 'error');
                  }
                });
              }

              // Handle dynamic display of extra fields for date/time conditions
              const handleDateTimeExtraFields = () => {
                const selectedKey = keySelect.value;
                const dateTimeExtraContainer = document.getElementById(
                  `swal-date-time-extra-${sanitizedBotIdForDOM}`
                );
                if (dateTimeExtraContainer) {
                  if (
                    selectedKey === 'Time of Day (HH:MM)' ||
                    selectedKey === 'Specific Date (YYYY-MM-DD)'
                  ) {
                    dateTimeExtraContainer.style.display = 'block';
                  } else {
                    dateTimeExtraContainer.style.display = 'none';
                  }
                }
              };

              keySelect.addEventListener('change', handleDateTimeExtraFields);
              handleDateTimeExtraFields();
            },
          });
        });
      });
    }
  }

  setupSwalDashboardModalStyle();
});
