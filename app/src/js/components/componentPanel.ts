import { CategoryDefinition } from '../models/types.js';

/**
 * Populate component categories in the component panel
 */
export function populateComponentsPanel(): void {
  const componentCategories = document.getElementById('component-categories');
  if (!componentCategories) return;
  
  // Define component categories and their associated node types
  const categories: CategoryDefinition[] = [
    {
      name: 'Conversation Flow',
      icon: '💬',
      components: [
        { type: 'start', icon: '🚀', label: 'Start' },
        { type: 'message', icon: '💬', label: 'Message' },
        { type: 'options', icon: '📋', label: 'Options' },
        { type: 'input', icon: '📝', label: 'User Input' }
      ]
    },
    {
      name: 'Logic',
      icon: '🔀',
      components: [
        { type: 'condition', icon: '🔀', label: 'Condition' },
        { type: 'math', icon: '🧮', label: 'Math' }
      ]
    }
  ];
  
  // Generate HTML for each category
  categories.forEach(category => {
    // Create category container
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'component-category';
    
    // Create category title
    const categoryTitle = document.createElement('div');
    categoryTitle.className = 'category-title';
    categoryTitle.textContent = category.name;
    categoryDiv.appendChild(categoryTitle);
    
    // Create component list
    const componentList = document.createElement('div');
    componentList.className = 'component-list';
    
    // Add components to list
    category.components.forEach(component => {
      const componentItem = document.createElement('div');
      componentItem.className = 'component-item';
      componentItem.setAttribute('draggable', 'true');
      componentItem.setAttribute('data-type', component.type);
      
      const componentIcon = document.createElement('div');
      componentIcon.className = 'component-icon';
      componentIcon.textContent = component.icon;
      
      const componentName = document.createElement('div');
      componentName.className = 'component-name';
      componentName.textContent = component.label;
      
      componentItem.appendChild(componentIcon);
      componentItem.appendChild(componentName);
      componentList.appendChild(componentItem);
      
      // Add drag event listeners
      componentItem.addEventListener('dragstart', (e) => {
        const dataTransfer = (e as DragEvent).dataTransfer;
        if (dataTransfer) {
          dataTransfer.setData('text/plain', component.type);
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
  });
}