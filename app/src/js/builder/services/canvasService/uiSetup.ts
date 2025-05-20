import {
  enterTransition,
  staggerAnimation,
  addRippleEffect,
  createRippleEffect,
  showPageTransition,
  typeText,
  exitTransition,
} from '../../utils/transitions';
import { populateComponentsPanel } from '../componentService/componentPanel';

declare const LeaderLine: any;

async function loadLeaderLineScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof LeaderLine !== 'undefined') {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/leader-line-new@1.1.9/leader-line.min.js';
    script.onload = () => resolve();
    script.onerror = err => reject(new Error('Failed to load LeaderLine: ' + err));
    document.head.appendChild(script);
  });
}

export async function initUiSetup(): Promise<void> {
  document.body.classList.remove('js-loading');
  await loadLeaderLineScript();

  const workspace = document.querySelector('.workspace') as HTMLElement;
  const sidePanel = document.querySelector('.side-panel') as HTMLElement;
  const rightPanel = document.querySelector('.right-panel') as HTMLElement;
  const header = document.querySelector('header') as HTMLElement;

  if (workspace) enterTransition(workspace, 'fade', 400, 0);
  if (header) enterTransition(header, 'slide-down', 400, 0);
  if (sidePanel) enterTransition(sidePanel, 'slide-right', 400, 100);
  if (rightPanel) enterTransition(rightPanel, 'slide-left', 400, 200);

  const toolbarButtons = document.querySelectorAll('.toolbar-button');
  if (toolbarButtons.length) {
    staggerAnimation(toolbarButtons, 'fade', 80, 300);
  }

  addRippleEffect('.button');
  addRippleEffect('.menu-item');
  addRippleEffect('.toolbar-button');

  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', e => {
      const target = e.currentTarget as HTMLElement;
      const page = target.getAttribute('data-page');
      createRippleEffect(target, e as MouseEvent);
      if (page === 'dashboard') {
        showPageTransition('index.html', {
          message: 'Loading Dashboard...',
          delay: 600,
        });
      }
    });
  });

  populateComponentsPanel();

  const welcomeMessage = document.querySelector('.welcome-message') as HTMLElement;
  if (welcomeMessage) {
    typeText(
      welcomeMessage,
      'Welcome to VisualBotCreator! Drag components to build your bot.',
      30,
      800
    );
  }
}
