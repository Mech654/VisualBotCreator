import {
  changeNameDb,
  changeDescriptionDb,
  changeStatusDb,
  addOrUpdateBotConditionDb,
  deleteBotConditionDb,
} from './database';

export async function changeName(botId: string, newName: string) {
  const botNameElement = document.querySelector(`.bot-name[data-bot-id="${botId}"]`);
  if (botNameElement) {
    botNameElement.textContent = newName;
  }

  // Try to use IPC if available (when called from renderer)
  if (typeof window !== 'undefined' && window.botconfig?.changeName) {
    return window.botconfig.changeName(botId, newName);
  } else {
    // Direct call when used from main process
    return changeNameDb(botId, newName);
  }
}

export async function changeDescription(botId: string, newDescription: string) {
  const botDescriptionElement = document.querySelector(`.bot-description[data-bot-id="${botId}"]`);
  if (botDescriptionElement) {
    botDescriptionElement.textContent = newDescription;
  }

  // Try to use IPC if available (when called from renderer)
  if (typeof window !== 'undefined' && window.botconfig?.changeDescription) {
    return window.botconfig.changeDescription(botId, newDescription);
  } else {
    // Direct call when used from main process
    return changeDescriptionDb(botId, newDescription);
  }
}

export async function changeStatus(botId: string, newStatus: boolean) {
  const botStatusElement = document.querySelector(`.bot-status[data-bot-id="${botId}"]`);
  if (botStatusElement) {
    botStatusElement.textContent = newStatus ? 'Online' : 'Offline';
  }

  // Try to use IPC if available (when called from renderer)
  if (typeof window !== 'undefined' && window.botconfig?.changeStatus) {
    return window.botconfig.changeStatus(botId, newStatus);
  } else {
    // Direct call when used from main process
    return changeStatusDb(botId, newStatus);
  }
}

export async function addOrUpdateBotCondition(botId: string, key: string, value: string) {
  // Try to use IPC if available (when called from renderer)
  if (typeof window !== 'undefined' && window.botconfig?.addOrUpdateCondition) {
    return window.botconfig.addOrUpdateCondition(botId, key, value);
  } else {
    // Direct call when used from main process
    return addOrUpdateBotConditionDb(botId, key, value);
  }
}

export async function deleteBotCondition(botId: string, key: string) {
  // Try to use IPC if available (when called from renderer)
  if (typeof window !== 'undefined' && window.botconfig?.deleteCondition) {
    return window.botconfig.deleteCondition(botId, key);
  } else {
    // Direct call when used from main process
    return deleteBotConditionDb(botId, key);
  }
}
