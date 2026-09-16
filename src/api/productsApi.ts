import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Category, PaginatedProducts, Product } from "./types";

const BASE_URL = "https://dummyjson.com";
const PAGE_SIZE = 20;

function getNextSkipValue(
  lastPage: PaginatedProducts,
  lastPageParam: number,
): number | undefined {
  const nextSkip = lastPageParam + lastPage.products.length;

  return nextSkip < lastPage.total ? nextSkip : undefined;
}

export const productsApi = createApi({
  reducerPath: "productsApi",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  tagTypes: ["Product"],
  endpoints: (builder) => ({
    getProducts: builder.infiniteQuery<
      PaginatedProducts,
      string | undefined,
      number
    >({
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages, lastPageParam) =>
          getNextSkipValue(lastPage, lastPageParam),
      },
      query: ({ queryArg, pageParam }) => ({
        url: queryArg ? `/products/category/${queryArg}` : "/products",
        params: { limit: PAGE_SIZE, skip: pageParam },
      }),
    }),

    searchProducts: builder.infiniteQuery<PaginatedProducts, string, number>({
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages, lastPageParam) =>
          getNextSkipValue(lastPage, lastPageParam),
      },
      query: ({ queryArg, pageParam }) => ({
        url: "/products/search",
        params: { q: queryArg, limit: PAGE_SIZE, skip: pageParam },
      }),
    }),

    getProductById: builder.query<Product, number>({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),
    getCategories: builder.query<Category[], void>({
      query: () => "/products/categories",
    }),
  }),
});
