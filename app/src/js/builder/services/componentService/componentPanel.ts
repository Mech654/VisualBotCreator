import { createIconElement, getIcon, loadComponentIcons } from '../../utils/iconLoader.js';

async function fetchAvailableComponents() {
  try {
    const nodeTypes: Array<string | { type: string; name: string; category: string }> =
      await window.nodeSystem.getRegisteredTypes();
    console.log(`client side has received ${nodeTypes.length} components`);

    const componentTypeNames = nodeTypes.map(nt =>
      typeof nt === 'string' ? nt : String(nt.type || '')
    );

    await loadComponentIcons(componentTypeNames);

    const categories: Record<
      string,
      Array<{ type: string; name: string; category: string; icon: string }>
    > = { Flow: [], Data: [], Variable: [] };

    for (const nodeType of nodeTypes) {
      let type: string;
      let name: string;
      let category: string;

      if (typeof nodeType === 'string') {
        type = nodeType;
        name = nodeType.charAt(0).toUpperCase() + type.slice(1);
        category = 'Flow';
      } else {
        type = String(nodeType.type || '');
        name = nodeType.name || (type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown');
        // Allow Flow, Data, or Variable as category
        if (nodeType.category === 'Data') category = 'Data';
        else if (nodeType.category === 'Variable') category = 'Variable';
        else category = 'Flow';
      }

      const iconSvg = getIcon(type.toLowerCase()) || '🧩';

      categories[category].push({
        type: String(type),
        name,
        category,
        icon: iconSvg,
      });
    }

    // Remove empty categories
    Object.keys(categories).forEach(cat => {
      if (categories[cat].length === 0) delete categories[cat];
    });

    return { categories };
  } catch (error) {
    console.error('Error fetching components:', error);
    return { categories: {} };
  }
}

export async function populateComponentsPanel(): Promise<void> {
  const componentCategoriesContainer = document.getElementById('component-categories');
  if (!componentCategoriesContainer) {
    return;
  }

  const searchHTML = `<div class="component-search">
    <input type="text" placeholder="Search components..." class="component-search-input">
  </div>`;

  componentCategoriesContainer.innerHTML = searchHTML;

  const favoritesHTML = `
  <div class="favorites-section">
    <div class="favorites-header">⭐ Quick Access</div>
    <div class="favorites-list">
      <div class="component-item favorite-item" draggable="true" data-type="message" data-flow-type="flow">
        <div class="flow-type-indicator flow-type"></div>
        <div class="component-icon">💬</div>
        <div class="component-name">Message</div>
      </div>
      <div class="component-item favorite-item" draggable="true" data-type="condition" data-flow-type="flow">
        <div class="flow-type-indicator flow-type"></div>
        <div class="component-icon">❓</div>
        <div class="component-name">Condition</div>
      </div>
    </div>
  </div>`;

  componentCategoriesContainer.innerHTML += favoritesHTML;

  const { categories } = await fetchAvailableComponents();

  for (const [categoryName, components] of Object.entries(categories)) {
    const categoryHTML = `
    <div class="component-category">
      <div class="category-header">
        <span class="category-icon">${getCategoryIcon(categoryName)}</span>
        <div class="category-title">${categoryName}</div>
        <span class="category-toggle">▼</span>
      </div>
      <div class="component-list">
        ${components
          .map(
            comp => `
          <div class="component-item" draggable="true" 
               data-type="${comp.type}" 
               data-flow-type="${getFlowType(comp.category)}"
               data-search-terms="${comp.type} ${comp.name} ${categoryName}">
            <div class="flow-type-indicator ${getFlowType(comp.category)}-type"></div>
            <div class="component-icon" data-component-type="${comp.type}">${comp.icon}</div>
            <div class="component-name">${comp.name}</div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>`;

    componentCategoriesContainer.innerHTML += categoryHTML;
  }

  const searchInput = document.querySelector('.component-search-input') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', filterComponents);
  }

  const categoryHeaders = document.querySelectorAll('.category-header');
  categoryHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const componentList = header.nextElementSibling as HTMLElement;
      componentList.classList.toggle('collapsed');

      const toggle = header.querySelector('.category-toggle') as HTMLElement;
      if (toggle) {
        toggle.textContent = componentList.classList.contains('collapsed') ? '►' : '▼';
      }
    });
  });

  const favoriteItems = document.querySelectorAll('.favorite-item .component-icon');
  favoriteItems.forEach(item => {
    const parentItem = item.closest('.component-item');
    if (parentItem) {
      const type = parentItem.getAttribute('data-type');
      if (type) {
        const svgIcon = getIcon(type.toLowerCase());
        if (svgIcon) {
          item.innerHTML = svgIcon;
        }
      }
    }
  });

  initDraggableComponents();
}

function getCategoryIcon(category: string): string {
  if (category === 'Data') {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line><line x1="12" y1="8" x2="12" y2="16"></line></svg>';
  }
  if (category === 'Variable') {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor">V</text></svg>';
  }
  // Default to Flow icon
  return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1-2-2h14a2 2 0 0 1 2 2z"></path></svg>';
}

function getFlowType(category: string): string {
  // Support Variable as data type for flowType
  if (category === 'Data' || category === 'Variable') return 'data';
  return 'flow';
}

function initDraggableComponents(): void {
  document.querySelectorAll('.component-item').forEach(item => {
    item.addEventListener('dragstart', (e: Event) => {
      const dragEvent = e as DragEvent;
      const target = e.target as HTMLElement;
      const type = target.dataset.type;
      const flowType = target.dataset.flowType || 'flow';

      if (dragEvent.dataTransfer) {
        dragEvent.dataTransfer.setData('text/plain', type || '');

        const data = {
          type,
          flowType,
        };

        dragEvent.dataTransfer.setData('application/json', JSON.stringify(data));
      }
    });
  });
}

function filterComponents(): void {
  const searchInput = document.querySelector('.component-search-input') as HTMLInputElement;
  if (!searchInput) return;
  const query = searchInput.value ? searchInput.value.toLowerCase() : '';

  document.querySelectorAll('.component-item:not(.favorite-item)').forEach(item => {
    const element = item as HTMLElement;
    const searchTerms = element.dataset.searchTerms?.toLowerCase() || '';

    if (query === '' || searchTerms.includes(query)) {
      element.style.display = 'flex';
    } else {
      element.style.display = 'none';
    }
  });

  document.querySelectorAll('.component-category').forEach(category => {
    const visibleComponents = category.querySelectorAll(
      '.component-item[style="display: flex"]'
    ).length;

    if (query === '' || visibleComponents > 0) {
      (category as HTMLElement).style.display = 'block';
    } else {
      (category as HTMLElement).style.display = 'none';
    }
  });
}
