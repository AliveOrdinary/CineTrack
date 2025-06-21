/**
 * Unit tests for avatar utility functions
 */

import {
  validateAvatarFile,
  getAvatarUrl,
  getInitials,
  generateDefaultAvatar,
  resizeImage,
  createCircularCrop
} from '@/lib/utils/avatar-utils';

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = jest.fn();
HTMLCanvasElement.prototype.toBlob = jest.fn();

describe('avatar-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAvatarFile', () => {
    it('should accept valid image files', () => {
      const validFile = new File([''], 'avatar.jpg', { type: 'image/jpeg' });
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateAvatarFile(validFile);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files that are too large', () => {
      const largeFile = new File([''], 'avatar.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 }); // 3MB

      const result = validateAvatarFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size must be less than 2MB');
    });

    it('should reject invalid file types', () => {
      const invalidFile = new File([''], 'document.pdf', { type: 'application/pdf' });
      Object.defineProperty(invalidFile, 'size', { value: 1024 }); // 1KB

      const result = validateAvatarFile(invalidFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File must be a JPEG, PNG, or WebP image');
    });

    it('should accept different valid image types', () => {
      const jpegFile = new File([''], 'avatar.jpg', { type: 'image/jpeg' });
      const pngFile = new File([''], 'avatar.png', { type: 'image/png' });
      const webpFile = new File([''], 'avatar.webp', { type: 'image/webp' });

      [jpegFile, pngFile, webpFile].forEach(file => {
        Object.defineProperty(file, 'size', { value: 1024 });
        const result = validateAvatarFile(file);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('getInitials', () => {
    it('should extract initials from single name', () => {
      expect(getInitials('John')).toBe('JO');
      expect(getInitials('Alice')).toBe('AL');
    });

    it('should extract initials from multiple names', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Alice Bob Cooper')).toBe('AB');
    });

    it('should handle empty or invalid names', () => {
      expect(getInitials('')).toBe('??');
      expect(getInitials('   ')).toBe('??');
    });

    it('should respect max length parameter', () => {
      expect(getInitials('John Doe Smith', 3)).toBe('JDS');
      expect(getInitials('John Doe Smith', 1)).toBe('J');
    });

    it('should handle special characters', () => {
      expect(getInitials('Jean-Paul Sartre')).toBe('JS');
      expect(getInitials("O'Brien")).toBe('OB');
    });
  });

  describe('generateDefaultAvatar', () => {
    it('should generate DiceBear URL with default parameters', () => {
      const url = generateDefaultAvatar('test-seed');
      expect(url).toContain('api.dicebear.com');
      expect(url).toContain('initials');
      expect(url).toContain('seed=test-seed');
    });

    it('should handle different styles', () => {
      expect(generateDefaultAvatar('test', 'avataaars')).toContain('avataaars');
      expect(generateDefaultAvatar('test', 'bottts')).toContain('bottts');
      expect(generateDefaultAvatar('test', 'identicon')).toContain('identicon');
    });

    it('should include size parameter', () => {
      const url = generateDefaultAvatar('test', 'initials', 300);
      expect(url).toContain('size=300');
    });

    it('should encode seed parameter', () => {
      const url = generateDefaultAvatar('test with spaces');
      expect(url).toContain('test%20with%20spaces');
    });
  });

  describe('getAvatarUrl', () => {
    it('should return user avatar URL when provided', () => {
      const userUrl = 'https://example.com/avatar.jpg';
      const result = getAvatarUrl(userUrl, 'fallback-seed');
      expect(result).toBe(userUrl);
    });

    it('should return generated avatar when user URL is empty', () => {
      const result = getAvatarUrl('', 'fallback-seed');
      expect(result).toContain('api.dicebear.com');
      expect(result).toContain('fallback-seed');
    });

    it('should return generated avatar when user URL is null', () => {
      const result = getAvatarUrl(null, 'fallback-seed');
      expect(result).toContain('api.dicebear.com');
    });

    it('should return generated avatar when user URL is undefined', () => {
      const result = getAvatarUrl(undefined, 'fallback-seed');
      expect(result).toContain('api.dicebear.com');
    });

    it('should trim whitespace from user URL', () => {
      const result = getAvatarUrl('   ', 'fallback-seed');
      expect(result).toContain('api.dicebear.com');
    });

    it('should respect size parameter', () => {
      const result = getAvatarUrl('', 'seed', 300);
      expect(result).toContain('size=300');
    });
  });

  describe('resizeImage', () => {
    let mockCanvas: HTMLCanvasElement;
    let mockContext: CanvasRenderingContext2D;
    let mockImage: HTMLImageElement;

    beforeEach(() => {
      mockContext = {
        drawImage: jest.fn(),
      } as any;

      mockCanvas = {
        getContext: jest.fn().mockReturnValue(mockContext),
        toBlob: jest.fn(),
        width: 0,
        height: 0
      } as any;

      // Mock document.createElement to return our mock canvas
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn().mockImplementation((tagName) => {
        if (tagName === 'canvas') return mockCanvas;
        if (tagName === 'img') {
          mockImage = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            width: 800,
            height: 600
          } as any;
          return mockImage;
        }
        return originalCreateElement.call(document, tagName);
      });

      (URL.createObjectURL as jest.Mock).mockReturnValue('blob:test-url');
    });

    it('should resize image successfully', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const processedBlob = new Blob(['processed'], { type: 'image/jpeg' });

      // Mock canvas toBlob to call callback immediately
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(processedBlob);
      });

      // Set up the image mock to trigger onload immediately
      let onloadHandler: (() => void) | null = null;
      Object.defineProperty(mockImage, 'onload', {
        set: (handler: () => void) => {
          onloadHandler = handler;
          // Trigger the handler immediately
          setTimeout(() => handler(), 0);
        },
        configurable: true
      });

      const result = await resizeImage(file, 400, 400);
      
      expect(result).toBe(processedBlob);
      expect(mockContext.drawImage).toHaveBeenCalled();
    });

    it('should handle canvas context error', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      (mockCanvas.getContext as jest.Mock).mockReturnValue(null);

      await expect(resizeImage(file)).rejects.toThrow('Could not get canvas context');
    });
  });

  describe('createCircularCrop', () => {
    let mockCanvas: HTMLCanvasElement;
    let mockContext: CanvasRenderingContext2D;
    let mockImage: HTMLImageElement;

    beforeEach(() => {
      mockContext = {
        beginPath: jest.fn(),
        arc: jest.fn(),
        clip: jest.fn(),
        drawImage: jest.fn(),
      } as any;

      mockCanvas = {
        getContext: jest.fn().mockReturnValue(mockContext),
        toBlob: jest.fn(),
        width: 0,
        height: 0
      } as any;

      const originalCreateElement = document.createElement;
      document.createElement = jest.fn().mockImplementation((tagName) => {
        if (tagName === 'canvas') return mockCanvas;
        if (tagName === 'img') {
          mockImage = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            width: 800,
            height: 600
          } as any;
          return mockImage;
        }
        return originalCreateElement.call(document, tagName);
      });
    });

    it('should create circular crop successfully', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const croppedBlob = new Blob(['cropped'], { type: 'image/jpeg' });

      // Mock canvas toBlob to call callback immediately
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(croppedBlob);
      });

      // Set up the image mock to trigger onload immediately
      Object.defineProperty(mockImage, 'onload', {
        set: (handler: () => void) => {
          // Trigger the handler immediately
          setTimeout(() => handler(), 0);
        },
        configurable: true
      });

      const result = await createCircularCrop(file, 200);
      
      expect(result).toBe(croppedBlob);
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.clip).toHaveBeenCalled();
      expect(mockContext.drawImage).toHaveBeenCalled();
    });

    it('should handle canvas context error', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      (mockCanvas.getContext as jest.Mock).mockReturnValue(null);

      await expect(createCircularCrop(file)).rejects.toThrow('Could not get canvas context');
    });
  });
});