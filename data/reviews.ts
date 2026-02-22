export interface Review {
  id: string;
  musicalId: string;
  musicalTitle: string;
  rating: number;
  reviewText: string;
  dateSeen: string | null;
}

let nextId = 1;

export function getNextId(): string {
  return String(nextId++);
}

export const reviews: Review[] = [];
