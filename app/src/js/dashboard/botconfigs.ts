import {
  changeNameDb,
  changeDescriptionDb,
  changeStatusDb,
  addOrUpdateBotConditionDb,
  deleteBotConditionDb,
} from '../../../core/database';

// Check if we're in the renderer process and should use IPC instead of direct database calls
const isRenderer = typeof window !== 'undefined' && window.botconfig !== undefined;

export async function changeName(botId: string, newName: string) {
  console.log('[CLIENT] changeName called with botId:', botId, 'newName:', newName);
  const botNameElement = document.querySelector(`.bot-name[data-bot-id="${botId}"]`);
  if (botNameElement) {
    console.log('[CLIENT] Updating UI element with new name:', newName);
    botNameElement.textContent = newName;
  } else {
    console.warn(
      '[CLIENT] Bot name element not found with selector:',
      `.bot-name[data-bot-id="${botId}"]`
    );
  }

  if (isRenderer && window.botconfig?.changeName) {
    console.log('[CLIENT] Using IPC to change name via botconfig.changeName');
    const result = await window.botconfig.changeName(botId, newName);
    console.log('[CLIENT] IPC result:', result);
    return result;
  } else {
    console.log('[CLIENT] Using direct DB call to change name');
    return changeNameDb(botId, newName);
  }
}

export async function changeDescription(botId: string, newDescription: string) {
  const botDescriptionElement = document.querySelector(`.bot-description[data-bot-id="${botId}"]`);
  if (botDescriptionElement) {
    botDescriptionElement.textContent = newDescription;
  }

  if (isRenderer && window.botconfig?.changeDescription) {
    return window.botconfig.changeDescription(botId, newDescription);
  } else {
    return changeDescriptionDb(botId, newDescription);
  }
}

export async function changeStatus(botId: string, newStatus: boolean) {
  const botStatusElement = document.querySelector(`.bot-status[data-bot-id="${botId}"]`);
  if (botStatusElement) {
    botStatusElement.textContent = newStatus ? 'Online' : 'Offline';
  }

  if (isRenderer && window.botconfig?.changeStatus) {
    return window.botconfig.changeStatus(botId, newStatus);
  } else {
    return changeStatusDb(botId, newStatus);
  }
}

export async function addOrUpdateBotCondition(botId: string, key: string, value: string) {
  if (isRenderer && window.botconfig?.addOrUpdateCondition) {
    return window.botconfig.addOrUpdateCondition(botId, key, value);
  } else {
    return addOrUpdateBotConditionDb(botId, key, value);
  }
}

export async function deleteBotCondition(botId: string, key: string) {
  if (isRenderer && window.botconfig?.deleteCondition) {
    return window.botconfig.deleteCondition(botId, key);
  } else {
    return deleteBotConditionDb(botId, key);
  }
}
