export interface ProductListItem {
  id: number;
  title: string;
  price: number;
  rating: number;
  stock: number;
  category: string;
  thumbnail: string;
  availabilityStatus: "In Stock" | "Low Stock" | "Out of Stock";
  discountPercentage: number;
}

export interface Product extends ProductListItem {
  description: string;
  brand?: string;
  images: string[];
  tags: string[];
  warrantyInformation: string;
  shippingInformation: string;
  returnPolicy: string;
  sku: string;
}

export interface PaginatedProducts {
  products: ProductListItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface Category {
  slug: string;
  name: string;
  url: string;
}