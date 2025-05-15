const iconMap: Record<string, string> = {};

const ICON_BASE_PATH = './assets/icons/';

/**
 * Register an SVG icon for a component type
 * @param componentType The component type (e.g., 'start', 'message')
 * @param svgContent The SVG content as a string
 */
export function registerIcon(componentType: string, svgContent: string): void {
  iconMap[componentType] = svgContent;
}

/**
 * Get the SVG icon for a component type
 * @param componentType The component type
 * @returns SVG content as a string, or undefined if not found
 */
export function getIcon(componentType: string): string | undefined {
  return iconMap[componentType];
}

/**
 * Create an SVG element from icon content
 * @param componentType The component type
 * @returns An SVG element, or null if no icon found
 */
export function createIconElement(componentType: string): SVGElement | null {
  const svgContent = getIcon(componentType);
  if (!svgContent) {
    return null;
  }

  // Create a wrapper div to parse the SVG string
  const wrapper = document.createElement('div');
  wrapper.innerHTML = svgContent.trim();

  // Extract the SVG element
  const svgElement = wrapper.firstChild as SVGElement;
  if (!svgElement || svgElement.nodeName !== 'svg') {
    return null;
  }

  // Ensure the SVG has the right properties
  svgElement.setAttribute('width', '24');
  svgElement.setAttribute('height', '24');
  svgElement.setAttribute('viewBox', '0 0 24 24');
  svgElement.setAttribute('class', 'component-icon');

  return svgElement;
}

/**
 * Dynamically load an SVG icon from file
 * @param componentType The component type
 * @returns Promise resolving to the SVG content
 */
async function loadSvgFromFile(componentType: string): Promise<string | null> {
  try {
    const url = `${ICON_BASE_PATH}${componentType}.svg`;
    const response = await fetch(url);

    if (response.ok) {
      return await response.text();
    } else {
      console.warn(
        `Icon not found for ${componentType}: ${response.status} ${response.statusText}`
      );
      return null;
    }
  } catch (error) {
    console.error(`Error loading icon for ${componentType}:`, error);
    return null;
  }
}

/**
 * Load icons for all registered component types
 * @param componentTypes Array of component type names
 */
export async function loadComponentIcons(componentTypes: string[]): Promise<void> {
  console.log(`Attempting to load icons for component types:`, componentTypes);

  for (const type of componentTypes) {
    // Try to load the SVG for this component
    const svgContent = await loadSvgFromFile(type);

    if (svgContent) {
      // If we found an SVG file, register it
      registerIcon(type, svgContent);
    }
  }
}

// Initialize with a set of fallback emoji icons
export function initializeDefaultIcons(): void {
  // Using SVG text elements with emoji as fallback
  const createEmojiSvg = (emoji: string) => {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <text x="12" y="14" font-size="14" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    </svg>`;
  };

  // Register default icons for common components
  registerIcon('start', createEmojiSvg('🚀'));
  registerIcon('message', createEmojiSvg('💬'));
  registerIcon('options', createEmojiSvg('📋'));
  registerIcon('condition', createEmojiSvg('❓'));
  registerIcon('input', createEmojiSvg('📝'));
  registerIcon('math', createEmojiSvg('🔢'));
  registerIcon('text', createEmojiSvg('📄'));
  registerIcon('increment', createEmojiSvg('➕'));
  registerIcon('random', createEmojiSvg('🎲'));
}

// Initialize default icons
initializeDefaultIcons();
