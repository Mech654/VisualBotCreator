import { createRippleEffect, enterTransition, exitTransition } from './transitions';

export function setupComponentPanelResize(): void {
  const rightPanelEl = document.querySelector('.right-panel') as HTMLElement;
  const resizeHandle = document.querySelector('.right-panel-resize-handle') as HTMLElement;
  const workspace = document.querySelector('.workspace') as HTMLElement;
  const builderContainer = document.querySelector('.builder-container') as HTMLElement;

  if (!rightPanelEl || !resizeHandle || !workspace) return;

  let startX = 0;
  let startWidth = 0;
  let isResizing = false;

  const styleProps = getComputedStyle(document.documentElement);
  const minWidth =
    parseInt(styleProps.getPropertyValue('--right-panel-min-width').trim(), 10) || 250;
  const maxWidth =
    parseInt(styleProps.getPropertyValue('--right-panel-max-width').trim(), 10) || 500;

  const disableTransitions = () => {
    rightPanelEl.style.transition = 'none';
    workspace.style.transition = 'none';
    if (builderContainer) builderContainer.style.transition = 'none';
  };

  const enableTransitions = () => {
    rightPanelEl.style.transition = '';
    workspace.style.transition = '';
    if (builderContainer) builderContainer.style.transition = '';
  };

  resizeHandle.addEventListener('mouseenter', () => {
    resizeHandle.style.backgroundColor = 'var(--primary-light)';
  });

  resizeHandle.addEventListener('mouseleave', () => {
    if (!isResizing) {
      resizeHandle.style.backgroundColor = '';
    }
  });

  resizeHandle.addEventListener('mousedown', e => {
    startX = e.clientX;
    startWidth = parseInt(getComputedStyle(rightPanelEl).width, 10);
    isResizing = true;
    disableTransitions();

    resizeHandle.style.backgroundColor = 'var(--primary)';
    document.body.style.cursor = 'col-resize';

    const overlay = document.createElement('div');
    overlay.id = 'resize-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.zIndex = '9999';
    overlay.style.cursor = 'col-resize';
    document.body.appendChild(overlay);
  });

  document.addEventListener('mousemove', e => {
    if (!isResizing) return;

    const deltaX = e.clientX - startX;
    let newWidth = startWidth - deltaX;

    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

    rightPanelEl.style.width = `${newWidth}px`;
    document.documentElement.style.setProperty('--right-panel-width', `${newWidth}px`);
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      enableTransitions();
      resizeHandle.style.backgroundColor = '';
      document.body.style.cursor = '';
      document.getElementById('resize-overlay')?.remove();

      const width = rightPanelEl.style.width;
      rightPanelEl.style.width = `calc(${width} - 3px)`;
      setTimeout(() => {
        rightPanelEl.style.width = width;
      }, 100);
    }
  });

  window.addEventListener('blur', () => {
    if (isResizing) {
      isResizing = false;
      enableTransitions();
      resizeHandle.style.backgroundColor = '';
      document.body.style.cursor = '';
      document.getElementById('resize-overlay')?.remove();
    }
  });
}

export function initPanelControls(): void {
  const sidePanel = document.querySelector('.side-panel') as HTMLElement;
  const rightPanel = document.querySelector('.right-panel') as HTMLElement;

  const togglePanel = document.querySelector('.toggle-panel');
  if (sidePanel && togglePanel) {
    togglePanel.addEventListener('click', e => {
      createRippleEffect(togglePanel as HTMLElement, e as MouseEvent);
      const isCollapsed = sidePanel.classList.contains('collapsed');
      let toggleSymbol = togglePanel.querySelector('.toggle-button-symbol');
      if (!toggleSymbol) {
        toggleSymbol = document.createElement('p');
        toggleSymbol.className = 'toggle-button-symbol';
        togglePanel.appendChild(toggleSymbol);
      }

      if (isCollapsed) {
        sidePanel.classList.remove('collapsed');
        if (toggleSymbol) toggleSymbol.textContent = '«';
        enterTransition(sidePanel, 'slide-right', 300);
      } else {
        exitTransition(sidePanel, 'slide-right', 300, 0, false).then(() => {
          sidePanel.classList.add('collapsed');
          if (toggleSymbol) toggleSymbol.textContent = '»';
        });
      }
    });
    sidePanel.classList.remove('collapsed');
    let toggleSymbol = togglePanel.querySelector('.toggle-button-symbol');
    if (!toggleSymbol) {
      toggleSymbol = document.createElement('p');
      toggleSymbol.className = 'toggle-button-symbol';
      togglePanel.appendChild(toggleSymbol);
    }
    toggleSymbol.textContent = '«';
  }

  const rightToggle = rightPanel?.querySelector('.toggle-right-panel');
  if (rightPanel && rightToggle) {
    rightToggle.addEventListener('click', e => {
      createRippleEffect(rightToggle as HTMLElement, e as MouseEvent);
      const isExpanded = rightPanel.classList.contains('expanded');
      const toggleSymbol = rightToggle.querySelector('.toggle-button-symbol');

      if (isExpanded) {
        exitTransition(rightPanel, 'slide-left', 300, 0, false).then(() => {
          rightPanel.classList.remove('expanded');
          if (toggleSymbol) toggleSymbol.textContent = '«';
        });
      } else {
        rightPanel.classList.add('expanded');
        if (toggleSymbol) toggleSymbol.textContent = '»';
        enterTransition(rightPanel, 'slide-left', 300);
      }
    });
    rightPanel.classList.add('expanded');
    const toggleSymbol = rightToggle.querySelector('.toggle-button-symbol');
    if (toggleSymbol) toggleSymbol.textContent = '»';
  }

  document.getElementById('properties-toggle')?.addEventListener('click', e => {
    const componentsPanel = document.querySelector('.components-container') as HTMLElement;
    const propertiesPanel = document.getElementById('properties-panel') as HTMLElement;
    const propertiesToggle = document.getElementById('properties-toggle');

    if (!componentsPanel || !propertiesPanel || !propertiesToggle) return;
    createRippleEffect(propertiesToggle, e);

    if (propertiesPanel.style.display === 'none') {
      exitTransition(componentsPanel, 'fade', 200).then(() => {
        componentsPanel.style.display = 'none';
        propertiesPanel.style.display = 'block';
        propertiesToggle.textContent = '🧩';
        enterTransition(propertiesPanel, 'fade', 200);
      });
    } else {
      exitTransition(propertiesPanel, 'fade', 200).then(() => {
        componentsPanel.style.display = 'flex';
        propertiesPanel.style.display = 'none';
        propertiesToggle.textContent = '📝';
        enterTransition(componentsPanel, 'fade', 200);
      });
    }
  });
  setupComponentPanelResize();
}
