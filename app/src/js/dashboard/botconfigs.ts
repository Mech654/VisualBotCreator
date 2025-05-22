import { changeNameDb, changeDescriptionDb, changeStatusDb, addOrUpdateBotConditionDb, deleteBotConditionDb } from '../../../core/database';

export function changeName(botId: string, newName: string) {
  const botNameElement = document.querySelector(`.bot-name[data-bot-id="${botId}"]`);
  if (botNameElement) {
    botNameElement.textContent = newName;
  }
  changeNameDb(botId, newName);
}

export function changeDescription(botId: string, newDescription: string) {
  const botDescriptionElement = document.querySelector(`.bot-description[data-bot-id="${botId}"]`);
  if (botDescriptionElement) {
    botDescriptionElement.textContent = newDescription;
  }
  changeDescriptionDb(botId, newDescription);
}

export function changeStatus(botId: string, newStatus: boolean) {
  const botStatusElement = document.querySelector(`.bot-status[data-bot-id="${botId}"]`);
  if (botStatusElement) {
    botStatusElement.textContent = newStatus ? 'Online' : 'Offline';
  }
  changeStatusDb(botId, newStatus);
}

export function addOrUpdateBotCondition(botId: string, key: string, value: string) {
  addOrUpdateBotConditionDb(botId, key, value);
}

export function deleteBotCondition(botId: string, key: string) {
  deleteBotConditionDb(botId, key);
}