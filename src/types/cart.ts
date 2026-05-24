export type CartItem = {
  id: string;
  title: string;
  price: number;
  coverImage?: string;
  instructorId?: string;
  instructor?: {
    name?: string;
  };
  [key: string]: unknown;
};
