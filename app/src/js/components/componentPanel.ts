// Utility function to fetch available components
import { createIconElement, getIcon, loadComponentIcons } from '../utils/iconLoader.js';

async function fetchAvailableComponents() {
  try {
    // Get registered node types from the backend
    const nodeTypes: Array<string | { type: string, name: string, category: string }> = await window.nodeSystem.getNodeTypes();

    // First, load all component icons by type name
    const componentTypeNames = nodeTypes.map(nt =>
      typeof nt === 'string' ? nt : String(nt.type || '')
    );

    // Load icons for all component types
    await loadComponentIcons(componentTypeNames);

    // Create a dictionary of categories
    const categories: Record<string, Array<{ type: string, name: string, category: string, icon: string }>> = {};

    // Process node types directly since getRegisteredTypes is not working
    for (const nodeType of nodeTypes) {
      // Extract information from the node type
      // nodeType could be just a string or an object with metadata
      let type: string;
      let name: string;
      let category: string;

      if (typeof nodeType === 'string') {
        type = nodeType;
        name = nodeType.charAt(0).toUpperCase() + type.slice(1);
        category = 'Components'; // Default category
      } else {
        // Handle the object case properly
        type = String(nodeType.type || '');
        name = nodeType.name || (type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown');
        category = nodeType.category || 'Components';
      }

      // Get appropriate SVG icon based on component type
      const iconSvg = getIcon(type.toLowerCase()) || '🧩'; // Default icon

      // Create category if it doesn't exist
      if (!categories[category]) {
        categories[category] = [];
      }

      // Add component to category with proper types
      categories[category].push({
        type: String(type),
        name,
        category,
        icon: iconSvg
      });
    }

    console.log('Fetched components by category:', categories);
    return { categories };
  } catch (error) {
    console.error('Error fetching components:', error);
    return { categories: {} };
  }
}

// Populate the components panel
export async function populateComponentsPanel(): Promise<void> {
  const componentCategoriesContainer = document.getElementById('component-categories');
  if (!componentCategoriesContainer) return;

  // Add search input
  const searchHTML = `<div class="component-search">
    <input type="text" placeholder="Search components..." class="component-search-input">
  </div>`;

  componentCategoriesContainer.innerHTML = searchHTML;

  // Add favorites section
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

  // Fetch available components
  const { categories } = await fetchAvailableComponents();

  // Add each category and its components
  for (const [categoryName, components] of Object.entries(categories)) {
    // Create category container
    const categoryHTML = `
    <div class="component-category">
      <div class="category-header">
        <span class="category-icon">${getCategoryIcon(categoryName)}</span>
        <div class="category-title">${categoryName}</div>
        <span class="category-toggle">▼</span>
      </div>
      <div class="component-list">
        ${components.map(comp => `
          <div class="component-item" draggable="true" 
               data-type="${comp.type}" 
               data-flow-type="${getFlowType(comp.type)}"
               data-search-terms="${comp.type} ${comp.name} ${categoryName}">
            <div class="flow-type-indicator ${getFlowType(comp.type)}-type"></div>
            <div class="component-icon" data-component-type="${comp.type}">${comp.icon}</div>
            <div class="component-name">${comp.name}</div>
          </div>
        `).join('')}
      </div>
    </div>`;

    componentCategoriesContainer.innerHTML += categoryHTML;
  }

  // Add event listeners for search
  const searchInput = document.querySelector('.component-search-input') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', filterComponents);
  }

  // Add event listeners for category toggles
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

  // Update favorites to use SVG icons
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

  // Initialize draggable components
  initDraggableComponents();
}

// Update to use SVG icons for categories if available
function getCategoryIcon(category: string): string {
  const categoryIcons: Record<string, string> = {
    'Conversation Flow': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    'Logic': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 12 21 22 3"></polygon></svg>',
    'Data Processing': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line><line x1="12" y1="8" x2="12" y2="16"></line></svg>',
    'Input/Output': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="12" x2="2" y2="12"></line><polyline points="5 15 2 12 5 9"></polyline><polyline points="19 9 22 12 19 15"></polyline></svg>',
    'Components': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
    'Media': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
    'Variables': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>'
  };

  return categoryIcons[category] || '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>';
}

// Determine if a component is a flow or data type
function getFlowType(type: string): string {
  // Components that are typically data components
  const dataComponents = [
    'math', 'variable', 'data', 'text', 'number',
    'boolean', 'array', 'object', 'function'
  ];

  // Check if the component type contains any data component keywords
  for (const comp of dataComponents) {
    if (type.toLowerCase().includes(comp)) {
      return 'data';
    }
  }

  // Default to flow type
  return 'flow';
}

// Initialize draggable components
function initDraggableComponents(): void {
  document.querySelectorAll('.component-item').forEach(item => {
    item.addEventListener('dragstart', (e: Event) => {
      // Cast the event to DragEvent to access dataTransfer
      const dragEvent = e as DragEvent;
      const target = e.target as HTMLElement;
      const type = target.dataset.type;
      const flowType = target.dataset.flowType || 'flow';

      // Set the drag data
      if (dragEvent.dataTransfer) {
        dragEvent.dataTransfer.setData('text/plain', type || '');

        // Also set JSON data with all attributes
        const data = {
          type,
          flowType
        };

        dragEvent.dataTransfer.setData('application/json', JSON.stringify(data));
      }
    });
  });
}

// Filter components based on search input
function filterComponents(): void {
  const searchInput = document.querySelector('.component-search-input') as HTMLInputElement;
  const query = searchInput.value.toLowerCase();

  // Show/hide components based on search
  document.querySelectorAll('.component-item:not(.favorite-item)').forEach(item => {
    const element = item as HTMLElement;
    const searchTerms = element.dataset.searchTerms?.toLowerCase() || '';

    if (query === '' || searchTerms.includes(query)) {
      element.style.display = 'flex';
    } else {
      element.style.display = 'none';
    }
  });

  // Show/hide categories with no visible components
  document.querySelectorAll('.component-category').forEach(category => {
    const visibleComponents = category.querySelectorAll('.component-item[style="display: flex"]').length;

    if (query === '' || visibleComponents > 0) {
      (category as HTMLElement).style.display = 'block';
    } else {
      (category as HTMLElement).style.display = 'none';
    }
  });
}