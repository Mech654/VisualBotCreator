import { CategoryDefinition } from '../models/types.js';

/**
 * Populate component categories in the component panel
 */
export function populateComponentsPanel(): void {
  const componentCategories = document.getElementById('component-categories');
  if (!componentCategories) return;

  // Define component categories and their associated node types - keeping only the core components
  const categories: CategoryDefinition[] = [
    {
      name: 'Flow Controls',
      icon: '🔄',
      components: [
        { type: 'start', icon: '🚀', label: 'Start', flowType: 'flow' },
        { type: 'condition', icon: '❓', label: 'Condition', flowType: 'flow' }
      ]
    },
    {
      name: 'Communication',
      icon: '💬',
      components: [
        { type: 'message', icon: '💬', label: 'Message', flowType: 'flow' },
        { type: 'options', icon: '📋', label: 'Options', flowType: 'flow' },
        { type: 'input', icon: '📝', label: 'User Input', flowType: 'flow' }
      ]
    },
    {
      name: 'Data Processing',
      icon: '🧮',
      components: [
        { type: 'math', icon: '🧮', label: 'Math', flowType: 'data' },
        { type: 'variable', icon: '📊', label: 'Variable', flowType: 'data' }
      ]
    }
  ];

  // Create search input
  const searchContainer = document.createElement('div');
  searchContainer.className = 'component-search';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search components...';
  searchInput.className = 'component-search-input';

  searchContainer.appendChild(searchInput);
  componentCategories.appendChild(searchContainer);

  // Generate HTML for each category
  const categoryElements: HTMLElement[] = [];

  categories.forEach(category => {
    // Create category container
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'component-category';

    // Create category header
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'category-header';

    const categoryIcon = document.createElement('span');
    categoryIcon.className = 'category-icon';
    categoryIcon.textContent = category.icon;

    const categoryTitle = document.createElement('div');
    categoryTitle.className = 'category-title';
    categoryTitle.textContent = category.name;

    // Add collapsible behavior
    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'category-toggle';
    toggleIcon.textContent = '▼';

    categoryHeader.appendChild(categoryIcon);
    categoryHeader.appendChild(categoryTitle);
    categoryHeader.appendChild(toggleIcon);
    categoryDiv.appendChild(categoryHeader);

    // Create component list
    const componentList = document.createElement('div');
    componentList.className = 'component-list';

    // Make header clickable to collapse/expand
    categoryHeader.addEventListener('click', () => {
      componentList.classList.toggle('collapsed');
      toggleIcon.textContent = componentList.classList.contains('collapsed') ? '▶' : '▼';
    });

    // Add components to list
    category.components.forEach(component => {
      const componentItem = document.createElement('div');
      componentItem.className = 'component-item';
      componentItem.setAttribute('draggable', 'true');
      componentItem.setAttribute('data-type', component.type);
      componentItem.setAttribute('data-flow-type', component.flowType || 'flow');
      componentItem.setAttribute('data-search-terms', `${component.label} ${component.type} ${category.name}`.toLowerCase());

      const componentIcon = document.createElement('div');
      componentIcon.className = 'component-icon';
      componentIcon.textContent = component.icon;

      const componentName = document.createElement('div');
      componentName.className = 'component-name';
      componentName.textContent = component.label;

      // Add a flow type indicator
      const flowTypeIndicator = document.createElement('div');
      flowTypeIndicator.className = `flow-type-indicator ${component.flowType || 'flow'}-type`;

      componentItem.appendChild(flowTypeIndicator);
      componentItem.appendChild(componentIcon);
      componentItem.appendChild(componentName);
      componentList.appendChild(componentItem);

      // Add drag event listeners
      componentItem.addEventListener('dragstart', (e) => {
        const dataTransfer = (e as DragEvent).dataTransfer;
        if (dataTransfer) {
          dataTransfer.setData('text/plain', component.type);
          dataTransfer.setData('application/json', JSON.stringify({
            type: component.type,
            flowType: component.flowType || 'flow'
          }));
        }

        setTimeout(() => {
          componentItem.style.opacity = '0.4';
        }, 0);
      });

      componentItem.addEventListener('dragend', () => {
        componentItem.style.opacity = '1';
      });
    });

    categoryDiv.appendChild(componentList);
    componentCategories.appendChild(categoryDiv);
    categoryElements.push(categoryDiv);
  });

  // Implement search functionality
  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();

    if (searchTerm === '') {
      // Show all categories and components
      categoryElements.forEach(categoryDiv => {
        categoryDiv.style.display = 'block';
        const components = categoryDiv.querySelectorAll('.component-item');
        components.forEach(comp => {
          (comp as HTMLElement).style.display = 'flex';
        });
      });
    } else {
      // Filter components
      categoryElements.forEach(categoryDiv => {
        const components = categoryDiv.querySelectorAll('.component-item');
        let hasVisibleComponents = false;

        components.forEach(comp => {
          const searchTerms = (comp as HTMLElement).getAttribute('data-search-terms') || '';
          if (searchTerms.includes(searchTerm)) {
            (comp as HTMLElement).style.display = 'flex';
            hasVisibleComponents = true;
          } else {
            (comp as HTMLElement).style.display = 'none';
          }
        });

        // Show/hide category based on whether it has visible components
        categoryDiv.style.display = hasVisibleComponents ? 'block' : 'none';
      });
    }
  });

  // Add quick access favorite section with only essential components
  const favoritesSection = document.createElement('div');
  favoritesSection.className = 'favorites-section';

  const favoritesHeader = document.createElement('div');
  favoritesHeader.className = 'favorites-header';
  favoritesHeader.textContent = '⭐ Quick Access';

  const favoritesList = document.createElement('div');
  favoritesList.className = 'favorites-list';

  // Add only the most essential components to favorites
  const favoriteComponents = [
    { type: 'message', icon: '💬', label: 'Message', flowType: 'flow' },
    { type: 'condition', icon: '❓', label: 'Condition', flowType: 'flow' }
  ];

  favoriteComponents.forEach(component => {
    const componentItem = document.createElement('div');
    componentItem.className = 'component-item favorite-item';
    componentItem.setAttribute('draggable', 'true');
    componentItem.setAttribute('data-type', component.type);
    componentItem.setAttribute('data-flow-type', component.flowType || 'flow');

    const componentIcon = document.createElement('div');
    componentIcon.className = 'component-icon';
    componentIcon.textContent = component.icon;

    const componentName = document.createElement('div');
    componentName.className = 'component-name';
    componentName.textContent = component.label;

    // Add a flow type indicator
    const flowTypeIndicator = document.createElement('div');
    flowTypeIndicator.className = `flow-type-indicator ${component.flowType || 'flow'}-type`;

    componentItem.appendChild(flowTypeIndicator);
    componentItem.appendChild(componentIcon);
    componentItem.appendChild(componentName);
    favoritesList.appendChild(componentItem);

    // Add drag event listeners
    componentItem.addEventListener('dragstart', (e) => {
      const dataTransfer = (e as DragEvent).dataTransfer;
      if (dataTransfer) {
        dataTransfer.setData('text/plain', component.type);
        dataTransfer.setData('application/json', JSON.stringify({
          type: component.type,
          flowType: component.flowType || 'flow'
        }));
      }

      setTimeout(() => {
        componentItem.style.opacity = '0.4';
      }, 0);
    });

    componentItem.addEventListener('dragend', () => {
      componentItem.style.opacity = '1';
    });
  });

  favoritesSection.appendChild(favoritesHeader);
  favoritesSection.appendChild(favoritesList);

  // Insert favorites at the top
  componentCategories.insertBefore(favoritesSection, searchContainer.nextSibling);
}