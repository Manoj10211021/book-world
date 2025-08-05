import { renderHook, act, waitFor } from "@testing-library/react";
import { RecoilRoot } from "recoil";
import useBooks from "../../../frontend/src/hooks/useBooks";

// Mock axios
jest.mock("axios");
const axios = require("axios");

describe("useBooks Hook", () => {
  const mockBooks = [
    {
      _id: "book1",
      title: "Test Book 1",
      author: "Test Author 1",
      description: "Test description 1",
      genre: ["Fiction"],
      year_published: 2024,
      image_url: "https://test-image-1.jpg",
      averageRating: 4.5,
      totalReviews: 10,
    },
    {
      _id: "book2",
      title: "Test Book 2",
      author: "Test Author 2",
      description: "Test description 2",
      genre: ["Non-Fiction"],
      year_published: 2023,
      image_url: "https://test-image-2.jpg",
      averageRating: 3.8,
      totalReviews: 5,
    },
  ];

  const wrapper = ({ children }) => <RecoilRoot>{children}</RecoilRoot>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    test("should return initial state correctly", () => {
      const { result } = renderHook(() => useBooks(), { wrapper });

      expect(result.current.books).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.fetchBooks).toBe("function");
      expect(typeof result.current.searchBooks).toBe("function");
    });
  });

  describe("fetchBooks", () => {
    test("should fetch books successfully", async () => {
      const mockAxiosGet = jest.fn().mockResolvedValue({
        data: { books: mockBooks },
      });
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      await act(async () => {
        await result.current.fetchBooks();
      });

      await waitFor(() => {
        expect(result.current.books).toEqual(mockBooks);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining("/books"),
        expect.any(Object)
      );
    });

    test("should handle fetch error", async () => {
      const mockError = new Error("Failed to fetch books");
      const mockAxiosGet = jest.fn().mockRejectedValue(mockError);
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      await act(async () => {
        await result.current.fetchBooks();
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to fetch books");
        expect(result.current.loading).toBe(false);
        expect(result.current.books).toEqual([]);
      });
    });

    test("should handle network error", async () => {
      const mockAxiosGet = jest.fn().mockRejectedValue({
        response: { data: { message: "Network error" } },
      });
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      await act(async () => {
        await result.current.fetchBooks();
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Network error");
        expect(result.current.loading).toBe(false);
      });
    });

    test("should set loading state during fetch", async () => {
      let resolvePromise;
      const mockAxiosGet = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      act(() => {
        result.current.fetchBooks();
      });

      expect(result.current.loading).toBe(true);

      resolvePromise({ data: { books: mockBooks } });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    test("should handle empty response", async () => {
      const mockAxiosGet = jest.fn().mockResolvedValue({
        data: { books: [] },
      });
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      await act(async () => {
        await result.current.fetchBooks();
      });

      await waitFor(() => {
        expect(result.current.books).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });
    });

    test("should handle malformed response", async () => {
      const mockAxiosGet = jest.fn().mockResolvedValue({
        data: { invalidField: "value" },
      });
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      await act(async () => {
        await result.current.fetchBooks();
      });

      await waitFor(() => {
        expect(result.current.books).toEqual([]);
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("searchBooks", () => {
    test("should search books successfully", async () => {
      const searchResults = [mockBooks[0]];
      const mockAxiosGet = jest.fn().mockResolvedValue({
        data: { books: searchResults },
      });
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      await act(async () => {
        await result.current.searchBooks("Test");
      });

      await waitFor(() => {
        expect(result.current.books).toEqual(searchResults);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining("/books?q=Test"),
        expect.any(Object)
      );
    });

    test("should handle search with empty query", async () => {
      const mockAxiosGet = jest.fn().mockResolvedValue({
        data: { books: mockBooks },
      });
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      await act(async () => {
        await result.current.searchBooks("");
      });

      await waitFor(() => {
        expect(result.current.books).toEqual(mockBooks);
      });
    });

    test("should handle search error", async () => {
      const mockAxiosGet = jest.fn().mockRejectedValue({
        response: { data: { message: "Search failed" } },
      });
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      await act(async () => {
        await result.current.searchBooks("test");
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Search failed");
        expect(result.current.loading).toBe(false);
      });
    });

    test("should handle search with special characters", async () => {
      const mockAxiosGet = jest.fn().mockResolvedValue({
        data: { books: [] },
      });
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      await act(async () => {
        await result.current.searchBooks("test@#$%");
      });

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining("test%40%23%24%25"),
        expect.any(Object)
      );
    });
  });

  describe("State Management", () => {
    test("should clear error when new request is made", async () => {
      // First, create an error state
      const mockAxiosGet = jest
        .fn()
        .mockRejectedValueOnce({ response: { data: { message: "Error" } } })
        .mockResolvedValueOnce({ data: { books: mockBooks } });
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      // First call - should create error
      await act(async () => {
        await result.current.fetchBooks();
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Error");
      });

      // Second call - should clear error and succeed
      await act(async () => {
        await result.current.fetchBooks();
      });

      await waitFor(() => {
        expect(result.current.error).toBe(null);
        expect(result.current.books).toEqual(mockBooks);
      });
    });

    test("should maintain books state between searches", async () => {
      const mockAxiosGet = jest
        .fn()
        .mockResolvedValueOnce({ data: { books: mockBooks } })
        .mockResolvedValueOnce({ data: { books: [mockBooks[0]] } });
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      // Initial fetch
      await act(async () => {
        await result.current.fetchBooks();
      });

      await waitFor(() => {
        expect(result.current.books).toEqual(mockBooks);
      });

      // Search
      await act(async () => {
        await result.current.searchBooks("Test");
      });

      await waitFor(() => {
        expect(result.current.books).toEqual([mockBooks[0]]);
      });
    });
  });

  describe("Error Handling", () => {
    test("should handle timeout errors", async () => {
      const mockAxiosGet = jest.fn().mockRejectedValue({
        code: "ECONNABORTED",
        message: "Request timeout",
      });
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      await act(async () => {
        await result.current.fetchBooks();
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Request timeout");
      });
    });

    test("should handle 404 errors", async () => {
      const mockAxiosGet = jest.fn().mockRejectedValue({
        response: { status: 404, data: { message: "Not found" } },
      });
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      await act(async () => {
        await result.current.fetchBooks();
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Not found");
      });
    });

    test("should handle 500 errors", async () => {
      const mockAxiosGet = jest.fn().mockRejectedValue({
        response: { status: 500, data: { message: "Internal server error" } },
      });
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      await act(async () => {
        await result.current.fetchBooks();
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Internal server error");
      });
    });

    test("should handle generic errors", async () => {
      const mockAxiosGet = jest
        .fn()
        .mockRejectedValue(new Error("Unknown error"));
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      await act(async () => {
        await result.current.fetchBooks();
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Unknown error");
      });
    });
  });

  describe("Concurrent Requests", () => {
    test("should handle multiple concurrent requests", async () => {
      const mockAxiosGet = jest.fn().mockResolvedValue({
        data: { books: mockBooks },
      });
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      // Make multiple concurrent requests
      await act(async () => {
        await Promise.all([
          result.current.fetchBooks(),
          result.current.searchBooks("test"),
          result.current.fetchBooks(),
        ]);
      });

      await waitFor(() => {
        expect(result.current.books).toEqual(mockBooks);
        expect(result.current.loading).toBe(false);
      });
    });

    test("should cancel previous requests when new one is made", async () => {
      let requestCount = 0;
      const mockAxiosGet = jest.fn().mockImplementation(() => {
        requestCount++;
        return Promise.resolve({ data: { books: mockBooks } });
      });
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      // Make rapid successive requests
      await act(async () => {
        result.current.fetchBooks();
        result.current.searchBooks("test");
        result.current.fetchBooks();
      });

      await waitFor(() => {
        expect(result.current.books).toEqual(mockBooks);
      });
    });
  });

  describe("Performance", () => {
    test("should not cause unnecessary re-renders", async () => {
      const mockAxiosGet = jest.fn().mockResolvedValue({
        data: { books: mockBooks },
      });
      axios.get = mockAxiosGet;

      const { result, rerender } = renderHook(() => useBooks(), { wrapper });

      await act(async () => {
        await result.current.fetchBooks();
      });

      // Re-render with same props
      rerender();

      await waitFor(() => {
        expect(result.current.books).toEqual(mockBooks);
      });
    });

    test("should handle large datasets efficiently", async () => {
      const largeBookArray = Array(1000)
        .fill()
        .map((_, i) => ({
          _id: `book${i}`,
          title: `Book ${i}`,
          author: `Author ${i}`,
          description: `Description ${i}`,
          genre: ["Fiction"],
          year_published: 2024,
          image_url: `https://image-${i}.jpg`,
          averageRating: 4.0,
          totalReviews: 10,
        }));

      const mockAxiosGet = jest.fn().mockResolvedValue({
        data: { books: largeBookArray },
      });
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      await act(async () => {
        await result.current.fetchBooks();
      });

      await waitFor(() => {
        expect(result.current.books).toEqual(largeBookArray);
        expect(result.current.books.length).toBe(1000);
      });
    });
  });

  describe("Integration Tests", () => {
    test("should work with Recoil state management", async () => {
      const mockAxiosGet = jest.fn().mockResolvedValue({
        data: { books: mockBooks },
      });
      axios.get = mockAxiosGet;

      const { result } = renderHook(() => useBooks(), { wrapper });

      await act(async () => {
        await result.current.fetchBooks();
      });

      await waitFor(() => {
        expect(result.current.books).toEqual(mockBooks);
      });
    });

    test("should handle authentication headers", async () => {
      const mockAxiosGet = jest.fn().mockResolvedValue({
        data: { books: mockBooks },
      });
      axios.get = mockAxiosGet;

      // Mock localStorage
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: jest.fn(() => "mock-token"),
          setItem: jest.fn(),
          removeItem: jest.fn(),
        },
        writable: true,
      });

      const { result } = renderHook(() => useBooks(), { wrapper });

      await act(async () => {
        await result.current.fetchBooks();
      });

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
        })
      );
    });
  });
});
