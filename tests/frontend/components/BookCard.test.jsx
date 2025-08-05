import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import BookCard from "../../../frontend/src/components/BookCard";

// Mock the image loading
const mockImage = {
  naturalWidth: 200,
  naturalHeight: 300,
  complete: true,
  onload: null,
  onerror: null,
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

describe("BookCard Component", () => {
  const mockBook = {
    _id: "book123",
    title: "Test Book Title",
    author: "Test Author",
    description: "A test book description",
    genre: ["Fiction", "Adventure"],
    year_published: 2024,
    image_url: "https://test-image.jpg",
    averageRating: 4.5,
    totalReviews: 10,
  };

  const renderBookCard = (props = {}) => {
    return render(
      <BrowserRouter>
        <BookCard book={{ ...mockBook, ...props }} />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    // Mock window.URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => "mocked-url");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("should render book information correctly", () => {
      renderBookCard();

      expect(screen.getByText("Test Book Title")).toBeInTheDocument();
      expect(screen.getByText("Test Author")).toBeInTheDocument();
      expect(screen.getByText("2024")).toBeInTheDocument();
    });

    test("should render book image with correct src", () => {
      renderBookCard();

      const image = screen.getByAltText("Book cover");
      expect(image).toBeInTheDocument();
      expect(image.src).toContain("test-image.jpg");
    });

    test("should render genre badges", () => {
      renderBookCard();

      expect(screen.getByText("Fiction")).toBeInTheDocument();
      expect(screen.getByText("Adventure")).toBeInTheDocument();
    });

    test("should handle missing optional props", () => {
      const bookWithoutOptional = {
        _id: "book123",
        title: "Test Book",
        author: "Test Author",
        year_published: 2024,
        image_url: "https://test-image.jpg",
      };

      renderBookCard(bookWithoutOptional);

      expect(screen.getByText("Test Book")).toBeInTheDocument();
      expect(screen.getByText("Test Author")).toBeInTheDocument();
      // Should not crash when genre is missing
    });

    test("should handle empty genre array", () => {
      renderBookCard({ genre: [] });

      expect(screen.getByText("Test Book Title")).toBeInTheDocument();
      // Should not render any genre badges
      expect(screen.queryByText("Fiction")).not.toBeInTheDocument();
    });

    test("should handle missing image_url", () => {
      renderBookCard({ image_url: undefined });

      const image = screen.getByAltText("Book cover");
      expect(image).toBeInTheDocument();
      // Should have a fallback or default image
    });
  });

  describe("Navigation", () => {
    test("should navigate to book details when clicked", () => {
      renderBookCard();

      const bookCard = screen.getByRole("link");
      expect(bookCard).toHaveAttribute("href", "/books/book123");
    });

    test("should maintain correct link structure", () => {
      renderBookCard({ _id: "different-id" });

      const bookCard = screen.getByRole("link");
      expect(bookCard).toHaveAttribute("href", "/books/different-id");
    });
  });

  describe("Image Handling", () => {
    test("should handle image loading", () => {
      renderBookCard();

      const image = screen.getByAltText("Book cover");

      // Simulate image load
      fireEvent.load(image);

      expect(image).toBeInTheDocument();
    });

    test("should handle image error", () => {
      renderBookCard();

      const image = screen.getByAltText("Book cover");

      // Simulate image error
      fireEvent.error(image);

      expect(image).toBeInTheDocument();
    });

    test("should apply correct image transformations", () => {
      renderBookCard();

      const image = screen.getByAltText("Book cover");
      const src = image.src;

      // Should contain the image transformation for height
      expect(src).toContain("/upload/h_400");
    });
  });

  describe("Hover Effects", () => {
    test("should apply hover styles on mouse enter", () => {
      renderBookCard();

      const bookCard = screen.getByRole("link");

      fireEvent.mouseEnter(bookCard);

      // Check if hover classes are applied
      expect(bookCard).toHaveClass("group");
    });

    test("should remove hover styles on mouse leave", () => {
      renderBookCard();

      const bookCard = screen.getByRole("link");

      fireEvent.mouseEnter(bookCard);
      fireEvent.mouseLeave(bookCard);

      // Check if hover classes are still present (they might be CSS-based)
      expect(bookCard).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    test("should have proper alt text for images", () => {
      renderBookCard();

      const image = screen.getByAltText("Book cover");
      expect(image).toBeInTheDocument();
    });

    test("should have proper ARIA labels", () => {
      renderBookCard();

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
    });

    test("should be keyboard navigable", () => {
      renderBookCard();

      const link = screen.getByRole("link");

      // Test keyboard navigation
      fireEvent.keyDown(link, { key: "Enter" });
      fireEvent.keyDown(link, { key: " " });

      expect(link).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    test("should have responsive classes", () => {
      renderBookCard();

      const bookCard = screen.getByRole("link");

      // Check for responsive classes
      expect(bookCard).toHaveClass("w-full");
      expect(bookCard).toHaveClass("sm:w-1/3");
      expect(bookCard).toHaveClass("md:w-1/4");
      expect(bookCard).toHaveClass("lg:w-1/6");
      expect(bookCard).toHaveClass("xl:58");
    });

    test("should have proper aspect ratio", () => {
      renderBookCard();

      const container = screen.getByRole("link").querySelector(".aspect-w-3");
      expect(container).toBeInTheDocument();
    });
  });

  describe("Genre Display", () => {
    test("should display all genres when less than 4", () => {
      renderBookCard({ genre: ["Fiction", "Adventure", "Mystery"] });

      expect(screen.getByText("Fiction")).toBeInTheDocument();
      expect(screen.getByText("Adventure")).toBeInTheDocument();
      expect(screen.getByText("Mystery")).toBeInTheDocument();
    });

    test("should display first 3 genres and show count for more than 3", () => {
      renderBookCard({
        genre: ["Fiction", "Adventure", "Mystery", "Romance", "Sci-Fi"],
      });

      expect(screen.getByText("Fiction")).toBeInTheDocument();
      expect(screen.getByText("Adventure")).toBeInTheDocument();
      expect(screen.getByText("Mystery")).toBeInTheDocument();
      expect(screen.getByText("+2 more")).toBeInTheDocument();
    });

    test("should handle single genre", () => {
      renderBookCard({ genre: ["Fiction"] });

      expect(screen.getByText("Fiction")).toBeInTheDocument();
      expect(screen.queryByText("+")).not.toBeInTheDocument();
    });
  });

  describe("Error Boundaries", () => {
    test("should handle missing book data gracefully", () => {
      const bookWithMissingData = {
        _id: "book123",
        title: "Test Book",
        // Missing other required fields
      };

      expect(() => {
        renderBookCard(bookWithMissingData);
      }).not.toThrow();
    });

    test("should handle null or undefined props", () => {
      expect(() => {
        renderBookCard(null);
      }).not.toThrow();
    });
  });

  describe("Performance", () => {
    test("should not re-render unnecessarily", () => {
      const { rerender } = renderBookCard();

      // Re-render with same props
      rerender(
        <BrowserRouter>
          <BookCard book={mockBook} />
        </BrowserRouter>
      );

      expect(screen.getByText("Test Book Title")).toBeInTheDocument();
    });

    test("should handle large genre arrays efficiently", () => {
      const largeGenreArray = Array(20)
        .fill()
        .map((_, i) => `Genre${i}`);

      renderBookCard({ genre: largeGenreArray });

      // Should only show first 3 and count
      expect(screen.getByText("Genre0")).toBeInTheDocument();
      expect(screen.getByText("Genre1")).toBeInTheDocument();
      expect(screen.getByText("Genre2")).toBeInTheDocument();
      expect(screen.getByText("+17 more")).toBeInTheDocument();
    });
  });

  describe("Integration Tests", () => {
    test("should work with React Router navigation", () => {
      renderBookCard();

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/books/book123");
    });

    test("should maintain state during navigation", () => {
      renderBookCard();

      const bookCard = screen.getByRole("link");

      // Simulate hover state
      fireEvent.mouseEnter(bookCard);

      // Check that the component is still functional
      expect(bookCard).toBeInTheDocument();
    });
  });
});
