import { useState } from 'react';

function usePagination<T>(
  items: T[],
  pageSize: number
): {
  currentPage: number;
  totalPages: number;
  paginatedItems: T[];
  setPage: (page: number) => void;
  goToFirstPage: () => void;
} {
  const [currentPage, setCurrentPage] = useState(1);
  const [prevItemsLength, setPrevItemsLength] = useState(items.length);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset to page 1 whenever items.length changes (derived state pattern)
  let activePage = currentPage;
  if (items.length !== prevItemsLength) {
    setPrevItemsLength(items.length);
    setCurrentPage(1);
    activePage = 1;
  }

  const safePage = Math.min(activePage, totalPages);
  const start = (safePage - 1) * pageSize;
  const paginatedItems = items.slice(start, start + pageSize);

  const setPage = (page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clamped);
  };

  const goToFirstPage = () => setCurrentPage(1);

  return {
    currentPage: safePage,
    totalPages,
    paginatedItems,
    setPage,
    goToFirstPage,
  };
}

export { usePagination };
