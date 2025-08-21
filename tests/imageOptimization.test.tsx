import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { MediaGallery } from '@/components/ui/MediaGallery';
import {
  generateCDNUrl,
  generateResponsiveUrls,
  generateSrcSet,
  getComedianProfileImage,
  supportsWebP,
  supportsAvif,
  calculateDimensions
} from '@/utils/imageOptimization';

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

describe('Image Optimization Utils', () => {
  describe('generateCDNUrl', () => {
    it('should generate CDN URL with transformations', () => {
      const url = generateCDNUrl('test.jpg', { width: 800, height: 600, quality: 90, format: 'webp' });
      expect(url).toContain('width=800');
      expect(url).toContain('height=600');
      expect(url).toContain('quality=90');
      expect(url).toContain('format=webp');
    });

    it('should handle existing URLs', () => {
      const existingUrl = 'https://example.com/image.jpg';
      const result = generateCDNUrl(existingUrl);
      expect(result).toBe(existingUrl);
    });

    it('should handle empty paths', () => {
      const result = generateCDNUrl('');
      expect(result).toBe('');
    });
  });

  describe('generateResponsiveUrls', () => {
    it('should generate all required sizes', () => {
      const urls = generateResponsiveUrls('test.jpg');
      expect(urls).toHaveProperty('thumbnail');
      expect(urls).toHaveProperty('small');
      expect(urls).toHaveProperty('medium');
      expect(urls).toHaveProperty('large');
      expect(urls).toHaveProperty('webp');
    });
  });

  describe('generateSrcSet', () => {
    it('should generate valid srcset string', () => {
      const srcset = generateSrcSet('test.jpg', ['small', 'medium', 'large']);
      expect(srcset).toContain('300w');
      expect(srcset).toContain('600w');
      expect(srcset).toContain('1200w');
    });
  });

  describe('getComedianProfileImage', () => {
    it('should return optimized URL for comedian with avatar', () => {
      const comedian = { avatar_url: 'profile.jpg', name: 'Test Comedian' };
      const result = getComedianProfileImage(comedian);
      expect(result).toContain('profile.jpg');
    });

    it('should return placeholder for comedian without avatar', () => {
      const comedian = { name: 'Test Comedian' };
      const result = getComedianProfileImage(comedian);
      expect(result).toContain('ui-avatars.com');
      expect(result).toContain('Test+Comedian');
    });

    it('should use stage name over regular name', () => {
      const comedian = { name: 'John Doe', stage_name: 'The Joker' };
      const result = getComedianProfileImage(comedian);
      expect(result).toContain('The+Joker');
    });
  });

  describe('calculateDimensions', () => {
    it('should maintain aspect ratio when resizing', () => {
      const result = calculateDimensions(1920, 1080, 800, 600);
      expect(result.width / result.height).toBeCloseTo(1920 / 1080);
    });

    it('should not upscale images', () => {
      const result = calculateDimensions(400, 300, 800, 600);
      expect(result.width).toBe(400);
      expect(result.height).toBe(300);
    });
  });
});

describe('OptimizedImage Component', () => {
  it('should render with placeholder initially', () => {
    render(
      <OptimizedImage
        src="test.jpg"
        alt="Test image"
        lazy={true}
        blur={true}
      />
    );

    // Should show placeholder
    const placeholder = screen.getByRole('img', { hidden: true });
    expect(placeholder).toBeInTheDocument();
  });

  it('should load image when visible', async () => {
    const mockObserve = jest.fn();
    const mockIntersectionObserver = jest.fn().mockImplementation(callback => ({
      observe: mockObserve,
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }));
    
    global.IntersectionObserver = mockIntersectionObserver;

    render(
      <OptimizedImage
        src="test.jpg"
        alt="Test image"
        lazy={true}
      />
    );

    expect(mockObserve).toHaveBeenCalled();
  });

  it('should handle loading errors', async () => {
    const onError = jest.fn();
    const { container } = render(
      <OptimizedImage
        src="invalid.jpg"
        alt="Test image"
        onError={onError}
        fallbackSrc="fallback.jpg"
      />
    );

    const img = container.querySelector('img');
    if (img) {
      // Simulate error
      img.dispatchEvent(new Event('error'));
      
      await waitFor(() => {
        expect(img.src).toContain('fallback.jpg');
      });
    }
  });

  it('should render with priority loading', () => {
    render(
      <OptimizedImage
        src="test.jpg"
        alt="Test image"
        priority={true}
      />
    );

    const img = screen.getByRole('img');
    expect(img).not.toHaveAttribute('loading', 'lazy');
  });
});

describe('OptimizedAvatar Component', () => {
  it('should render with image when src provided', () => {
    render(
      <OptimizedAvatar
        src="avatar.jpg"
        name="John Doe"
        size="md"
      />
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src');
    expect(img).toHaveAttribute('alt', 'John Doe');
  });

  it('should render fallback with initials when no src', () => {
    render(
      <OptimizedAvatar
        name="John Doe"
        size="md"
      />
    );

    const fallback = screen.getByText('JD');
    expect(fallback).toBeInTheDocument();
  });

  it('should apply correct size classes', () => {
    const { container } = render(
      <OptimizedAvatar
        name="Test"
        size="xl"
      />
    );

    const avatar = container.firstChild;
    expect(avatar).toHaveClass('h-16', 'w-16');
  });
});

describe('MediaGallery Component', () => {
  const mockItems = [
    { id: '1', src: 'image1.jpg', alt: 'Image 1' },
    { id: '2', src: 'image2.jpg', alt: 'Image 2' },
    { id: '3', src: 'image3.jpg', alt: 'Image 3' }
  ];

  it('should render all gallery items', () => {
    render(
      <MediaGallery
        items={mockItems}
        columns={3}
      />
    );

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(mockItems.length);
  });

  it('should apply correct grid classes', () => {
    const { container } = render(
      <MediaGallery
        items={mockItems}
        columns={4}
        gap="lg"
      />
    );

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('xl:grid-cols-4');
    expect(grid).toHaveClass('gap-6');
  });

  it('should show captions when enabled', () => {
    const itemsWithCaptions = mockItems.map(item => ({
      ...item,
      caption: `Caption for ${item.alt}`
    }));

    render(
      <MediaGallery
        items={itemsWithCaptions}
        showCaptions={true}
      />
    );

    expect(screen.getByText('Caption for Image 1')).toBeInTheDocument();
  });
});

describe('Format Support Detection', () => {
  it('should detect WebP support', () => {
    // Mock canvas toDataURL
    HTMLCanvasElement.prototype.toDataURL = jest.fn((type) => {
      if (type === 'image/webp') return 'data:image/webp;base64,';
      return 'data:image/png;base64,';
    });

    expect(supportsWebP()).toBe(true);
  });

  it('should detect AVIF support', () => {
    // Mock canvas toDataURL
    HTMLCanvasElement.prototype.toDataURL = jest.fn((type) => {
      if (type === 'image/avif') return 'data:image/avif;base64,';
      return 'data:image/png;base64,';
    });

    expect(supportsAvif()).toBe(true);
  });
});