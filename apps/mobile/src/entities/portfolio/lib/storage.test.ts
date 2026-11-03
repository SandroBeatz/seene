import { describe, expect, it } from '@jest/globals';
import { nextPortfolioOrder, storagePathFromUrl } from './storage';

describe('storagePathFromUrl', () => {
  const base = 'https://x.supabase.co/storage/v1/object/public/master-media';

  it('reads the path inside the bucket', () => {
    expect(storagePathFromUrl(`${base}/u1/portfolio-1.jpg`, 'master-media')).toBe(
      'u1/portfolio-1.jpg',
    );
  });

  it('ignores a query and decodes the name', () => {
    expect(storagePathFromUrl(`${base}/u1/a%20b.jpg?v=2`, 'master-media')).toBe('u1/a b.jpg');
  });

  it('does not touch a photo from elsewhere', () => {
    expect(storagePathFromUrl('https://cdn.example.com/a.jpg', 'master-media')).toBeNull();
    expect(storagePathFromUrl(`${base}/u1/a.jpg`, 'avatars')).toBeNull();
  });
});

describe('nextPortfolioOrder', () => {
  it('starts at one and goes after the last', () => {
    expect(nextPortfolioOrder([])).toBe(1);
    expect(nextPortfolioOrder([{ sort_order: 3 }, { sort_order: 7 }])).toBe(8);
  });
});
