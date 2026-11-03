import { describe, expect, it } from '@jest/globals';
import { filterPhotos, portfolioFilters } from './filters';

const services = [
  { id: 's1', specialization: 'nails' },
  { id: 's2', specialization: 'pedicure' },
  { id: 's3', specialization: null },
];
const photos = [
  { id: 'a', service_id: 's1' },
  { id: 'b', service_id: 's1' },
  { id: 'c', service_id: 's2' },
  { id: 'd', service_id: null },
  { id: 'e', service_id: 's3' },
  { id: 'f', service_id: 'deleted' },
];

describe('portfolioFilters', () => {
  it('counts the directions that have photos, the largest first', () => {
    expect(portfolioFilters(photos, services)).toEqual([
      { specialization: 'nails', count: 2 },
      { specialization: 'pedicure', count: 1 },
    ]);
  });

  it('has no chips without linked photos', () => {
    expect(portfolioFilters([{ id: 'd', service_id: null }], services)).toEqual([]);
  });
});

describe('filterPhotos', () => {
  it('keeps everything under "Все"', () => {
    expect(filterPhotos(photos, services, null)).toHaveLength(6);
  });

  it('keeps one direction', () => {
    expect(filterPhotos(photos, services, 'nails').map((p) => p.id)).toEqual(['a', 'b']);
  });
});
