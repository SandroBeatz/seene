/** The chips above the grid: a photo belongs to its service's direction. */
interface FilterPhoto {
  id: string;
  service_id: string | null;
}

interface FilterService {
  id: string;
  specialization: string | null;
}

export interface PortfolioFilter {
  specialization: string;
  count: number;
}

const directionOf = (photo: FilterPhoto, services: readonly FilterService[]) =>
  services.find((service) => service.id === photo.service_id)?.specialization ?? null;

/** Directions that have photos, the largest first. Photos without a service only show in "Все". */
export function portfolioFilters(
  photos: readonly FilterPhoto[],
  services: readonly FilterService[],
): PortfolioFilter[] {
  const counts = new Map<string, number>();
  for (const photo of photos) {
    const direction = directionOf(photo, services);
    if (direction) counts.set(direction, (counts.get(direction) ?? 0) + 1);
  }
  return [...counts]
    .map(([specialization, count]) => ({ specialization, count }))
    .sort((a, b) => b.count - a.count);
}

export function filterPhotos<P extends FilterPhoto>(
  photos: readonly P[],
  services: readonly FilterService[],
  specialization: string | null,
): readonly P[] {
  if (!specialization) return photos;
  return photos.filter((photo) => directionOf(photo, services) === specialization);
}
