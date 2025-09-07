import { CssRegistryStore } from '../css-registry.store';

// Mock DOM environment
const mockDocument = {
  createElement: jest.fn(() => ({
    id: '',
    setAttribute: jest.fn(),
    textContent: '',
  })),
  getElementById: jest.fn(() => null),
  head: {
    appendChild: jest.fn(),
  },
};

// Mock global document
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

describe('CssRegistryStore', () => {
  let store: CssRegistryStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = new CssRegistryStore();
  });

  describe('initialization', () => {
    it('should load default CSS classes', () => {
      const classes = store.getAllClasses();
      expect(classes.length).toBeGreaterThan(0);
      
      const buttonClass = store.getClass('rx-button');
      expect(buttonClass).toBeDefined();
      expect(buttonClass?.isBuiltIn).toBe(true);
      expect(buttonClass?.content).toContain('.rx-button');
    });

    it('should mark store as loaded', () => {
      expect(store.isLoaded()).toBe(true);
    });
  });

  describe('createClass', () => {
    it('should create a new CSS class', () => {
      const className = 'test-class';
      const content = '.test-class { color: red; }';
      
      const success = store.createClass(className, content);
      
      expect(success).toBe(true);
      const createdClass = store.getClass(className);
      expect(createdClass).toBeDefined();
      expect(createdClass?.name).toBe(className);
      expect(createdClass?.content).toBe(content);
      expect(createdClass?.isBuiltIn).toBe(false);
    });

    it('should not create duplicate classes', () => {
      const className = 'test-class';
      const content = '.test-class { color: red; }';
      
      store.createClass(className, content);
      const success = store.createClass(className, content);
      
      expect(success).toBe(false);
    });

    it('should not allow creating classes with existing names', () => {
      const success = store.createClass('rx-button', '.rx-button { color: blue; }');
      expect(success).toBe(false);
    });
  });

  describe('updateClass', () => {
    it('should update existing CSS class', () => {
      const className = 'test-class';
      const originalContent = '.test-class { color: red; }';
      const updatedContent = '.test-class { color: blue; }';
      
      store.createClass(className, originalContent);
      const success = store.updateClass(className, updatedContent);
      
      expect(success).toBe(true);
      const updatedClass = store.getClass(className);
      expect(updatedClass?.content).toBe(updatedContent);
    });

    it('should not update non-existent classes', () => {
      const success = store.updateClass('non-existent', '.test { color: red; }');
      expect(success).toBe(false);
    });

    it('should update built-in classes', () => {
      const updatedContent = '.rx-button { color: purple; }';
      const success = store.updateClass('rx-button', updatedContent);
      
      expect(success).toBe(true);
      const updatedClass = store.getClass('rx-button');
      expect(updatedClass?.content).toBe(updatedContent);
    });
  });

  describe('removeClass', () => {
    it('should remove custom CSS classes', () => {
      const className = 'test-class';
      const content = '.test-class { color: red; }';
      
      store.createClass(className, content);
      const success = store.removeClass(className);
      
      expect(success).toBe(true);
      expect(store.hasClass(className)).toBe(false);
    });

    it('should not remove built-in classes', () => {
      const success = store.removeClass('rx-button');
      expect(success).toBe(false);
      expect(store.hasClass('rx-button')).toBe(true);
    });

    it('should not remove non-existent classes', () => {
      const success = store.removeClass('non-existent');
      expect(success).toBe(false);
    });
  });

  describe('getClassNames', () => {
    it('should return all class names', () => {
      const classNames = store.getClassNames();
      expect(classNames).toContain('rx-button');
      expect(classNames).toContain('rx-container');
      expect(classNames).toContain('rx-comp-div');
    });

    it('should include custom classes', () => {
      store.createClass('custom-class', '.custom-class { color: red; }');
      const classNames = store.getClassNames();
      expect(classNames).toContain('custom-class');
    });
  });

  describe('hasClass', () => {
    it('should return true for existing classes', () => {
      expect(store.hasClass('rx-button')).toBe(true);
    });

    it('should return false for non-existent classes', () => {
      expect(store.hasClass('non-existent')).toBe(false);
    });
  });

  describe('getLastModified', () => {
    it('should update when classes are modified', () => {
      const initialTime = store.getLastModified();
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        store.createClass('test-class', '.test-class { color: red; }');
        const newTime = store.getLastModified();
        expect(newTime).toBeGreaterThan(initialTime);
      }, 10);
    });
  });
});
