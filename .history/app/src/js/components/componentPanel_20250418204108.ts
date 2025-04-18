// Utility function to fetch components dynamically
async function fetchAvailableComponents() {
  try {
    // Get registered node types from the backend
    const components = await window.nodeSystem.getNodeTypes();
    
    // Create a dictionary of categories
    const categories: Record<string, Array<{type: string, name: string, category: string, icon: string}>> = {};
    
    // For each component, add it to its category
    for (const component of components) {
      const { type, name, category } = component;
      
      // Choose an appropriate icon based on component type
      let icon = '🧩'; // Default icon
      
      switch (type.toLowerCase()) {
        case 'start':
          icon = '🚀';
          break;
        case 'message':
          icon = '💬';
          break;
        case 'options':
          icon = '📋';
          break;
        case 'input':
          icon = '📝';
          break;
        case 'condition':
          icon = '❓';
          break;
        case 'math':
          icon = '🧮';
          break;
        default:
          // Try to guess an appropriate icon based on the component type
          if (type.toLowerCase().includes('text') || type.toLowerCase().includes('string')) {
            icon = '📄';
          } else if (type.toLowerCase().includes('number') || type.toLowerCase().includes('math')) {
            icon = '🔢';
          } else if (type.toLowerCase().includes('media') || type.toLowerCase().includes('image')) {
            icon = '🖼️';
          } else if (type.toLowerCase().includes('logic') || type.toLowerCase().includes('condition')) {
            icon = '🔄';
          } else if (type.toLowerCase().includes('data') || type.toLowerCase().includes('variable')) {
            icon = '💾';
          }
      }
      
      // Create category if it doesn't exist
      if (!categories[category]) {
        categories[category] = [];
      }
      
      // Add component to category
      categories[category].push({ 
        type, 
        name, 
        category,
        icon
      });
    }
    
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
            <div class="component-icon">${comp.icon}</div>
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
  
  // Initialize draggable components
  initDraggableComponents();
}

// Get a general icon for a category
function getCategoryIcon(category: string): string {
  const categoryIcons: Record<string, string> = {
    'Conversation Flow': '💬',
    'Communication': '💬',
    'Logic': '🔄',
    'Data Processing': '🧮',
    'Components': '🧩',
    'Input/Output': '📥',
    'Media': '🖼️',
    'Variables': '🔠'
  };
  
  return categoryIcons[category] || '🧩';
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