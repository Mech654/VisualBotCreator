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

      const iconSvg = getIcon(type.toLowerCase()) || '<i class="bi bi-puzzle-fill"></i>';

      categories[category].push({
        type: String(type),
        name,
        category,
        icon: iconSvg,
      });
    }

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
    return '<i class="bi bi-database-fill"></i>';
  }
  if (category === 'Variable') {
    return '<i class="bi bi-box-fill"></i>';
  }
  // Default to Flow icon
  return '<i class="bi bi-diagram-2-fill"></i>';
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
