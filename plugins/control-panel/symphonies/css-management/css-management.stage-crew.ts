// Stage-crew handlers for CSS class management operations
// Handles creation, editing, and removal of CSS classes

import { cssRegistry } from '../../state/css-registry.store';

export function createCssClass(data: any, ctx: any) {
  const { className, content } = data || {};
  
  if (!className || typeof className !== 'string') {
    ctx.logger?.error?.('CSS class creation failed: className is required');
    return;
  }

  const cssContent = content || `.${className} {
  /* Add your CSS properties here */
  display: block;
  position: relative;
}`;

  try {
    const success = cssRegistry.createClass(className, cssContent);
    
    if (success) {
      ctx.payload.className = className;
      ctx.payload.content = cssContent;
      ctx.payload.success = true;
      ctx.logger?.info?.(`CSS class "${className}" created successfully`);
    } else {
      ctx.payload.success = false;
      ctx.payload.error = `CSS class "${className}" already exists`;
      ctx.logger?.warn?.(`CSS class creation failed: "${className}" already exists`);
    }
  } catch (error) {
    ctx.payload.success = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.('CSS class creation failed:', error);
  }
}

export function updateCssClass(data: any, ctx: any) {
  const { className, content } = data || {};
  
  if (!className || typeof className !== 'string') {
    ctx.logger?.error?.('CSS class update failed: className is required');
    return;
  }

  if (!content || typeof content !== 'string') {
    ctx.logger?.error?.('CSS class update failed: content is required');
    return;
  }

  try {
    const success = cssRegistry.updateClass(className, content);
    
    if (success) {
      ctx.payload.className = className;
      ctx.payload.content = content;
      ctx.payload.success = true;
      ctx.logger?.info?.(`CSS class "${className}" updated successfully`);
    } else {
      ctx.payload.success = false;
      ctx.payload.error = `CSS class "${className}" not found`;
      ctx.logger?.warn?.(`CSS class update failed: "${className}" not found`);
    }
  } catch (error) {
    ctx.payload.success = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.('CSS class update failed:', error);
  }
}

export function deleteCssClass(data: any, ctx: any) {
  const { className } = data || {};
  
  if (!className || typeof className !== 'string') {
    ctx.logger?.error?.('CSS class deletion failed: className is required');
    return;
  }

  try {
    const classDefinition = cssRegistry.getClass(className);
    
    if (classDefinition?.isBuiltIn) {
      ctx.payload.success = false;
      ctx.payload.error = `Cannot delete built-in CSS class "${className}"`;
      ctx.logger?.warn?.(`CSS class deletion failed: "${className}" is built-in`);
      return;
    }

    const success = cssRegistry.removeClass(className);
    
    if (success) {
      ctx.payload.className = className;
      ctx.payload.success = true;
      ctx.logger?.info?.(`CSS class "${className}" deleted successfully`);
      
      // Remove class from all elements that use it
      removeClassFromAllElements(className, ctx);
    } else {
      ctx.payload.success = false;
      ctx.payload.error = `CSS class "${className}" not found`;
      ctx.logger?.warn?.(`CSS class deletion failed: "${className}" not found`);
    }
  } catch (error) {
    ctx.payload.success = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.('CSS class deletion failed:', error);
  }
}

export function getCssClass(data: any, ctx: any) {
  const { className } = data || {};
  
  if (!className || typeof className !== 'string') {
    ctx.logger?.error?.('CSS class retrieval failed: className is required');
    return;
  }

  try {
    const classDefinition = cssRegistry.getClass(className);
    
    if (classDefinition) {
      ctx.payload.className = className;
      ctx.payload.content = classDefinition.content;
      ctx.payload.isBuiltIn = classDefinition.isBuiltIn;
      ctx.payload.createdAt = classDefinition.createdAt;
      ctx.payload.updatedAt = classDefinition.updatedAt;
      ctx.payload.success = true;
    } else {
      ctx.payload.success = false;
      ctx.payload.error = `CSS class "${className}" not found`;
    }
  } catch (error) {
    ctx.payload.success = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.('CSS class retrieval failed:', error);
  }
}

export function listCssClasses(data: any, ctx: any) {
  try {
    const classes = cssRegistry.getAllClasses();
    
    ctx.payload.classes = classes.map(cls => ({
      name: cls.name,
      isBuiltIn: cls.isBuiltIn,
      createdAt: cls.createdAt,
      updatedAt: cls.updatedAt
    }));
    ctx.payload.count = classes.length;
    ctx.payload.success = true;
    
    ctx.logger?.info?.(`Retrieved ${classes.length} CSS classes`);
  } catch (error) {
    ctx.payload.success = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.('CSS classes listing failed:', error);
  }
}

// Helper function to remove a CSS class from all DOM elements
function removeClassFromAllElements(className: string, ctx: any) {
  if (typeof document === 'undefined') return;

  try {
    const elements = document.querySelectorAll(`.${className}`);
    let removedCount = 0;

    elements.forEach(element => {
      element.classList.remove(className);
      removedCount++;
    });

    ctx.payload.elementsUpdated = removedCount;
    
    if (removedCount > 0) {
      ctx.logger?.info?.(`Removed class "${className}" from ${removedCount} elements`);
    }
  } catch (error) {
    ctx.logger?.warn?.('Failed to remove class from DOM elements:', error);
  }
}

// Helper function to apply CSS class to specific element
export function applyCssClassToElement(data: any, ctx: any) {
  const { elementId, className } = data || {};
  
  if (!elementId || !className) {
    ctx.logger?.error?.('Apply CSS class failed: elementId and className are required');
    return;
  }

  if (typeof document === 'undefined') return;

  try {
    const element = document.getElementById(String(elementId));
    
    if (element) {
      element.classList.add(className);
      ctx.payload.elementId = elementId;
      ctx.payload.className = className;
      ctx.payload.success = true;
      ctx.logger?.info?.(`Applied class "${className}" to element "${elementId}"`);
    } else {
      ctx.payload.success = false;
      ctx.payload.error = `Element with ID "${elementId}" not found`;
      ctx.logger?.warn?.(`Apply CSS class failed: element "${elementId}" not found`);
    }
  } catch (error) {
    ctx.payload.success = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.('Apply CSS class failed:', error);
  }
}

// Helper function to remove CSS class from specific element
export function removeCssClassFromElement(data: any, ctx: any) {
  const { elementId, className } = data || {};
  
  if (!elementId || !className) {
    ctx.logger?.error?.('Remove CSS class failed: elementId and className are required');
    return;
  }

  if (typeof document === 'undefined') return;

  try {
    const element = document.getElementById(String(elementId));
    
    if (element) {
      element.classList.remove(className);
      ctx.payload.elementId = elementId;
      ctx.payload.className = className;
      ctx.payload.success = true;
      ctx.logger?.info?.(`Removed class "${className}" from element "${elementId}"`);
    } else {
      ctx.payload.success = false;
      ctx.payload.error = `Element with ID "${elementId}" not found`;
      ctx.logger?.warn?.(`Remove CSS class failed: element "${elementId}" not found`);
    }
  } catch (error) {
    ctx.payload.success = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.('Remove CSS class failed:', error);
  }
}
