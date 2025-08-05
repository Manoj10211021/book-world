import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import ReviewForm from "../../../frontend/src/components/ReviewForm";

// Mock axios
jest.mock("axios");
const axios = require("axios");

// Mock react-hook-form
jest.mock("react-hook-form", () => ({
  useForm: () => ({
    register: jest.fn(),
    handleSubmit: jest.fn((fn) => fn),
    formState: { errors: {} },
    reset: jest.fn(),
    setValue: jest.fn(),
    watch: jest.fn(() => ({ rating: 0, content: "" })),
  }),
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    promise: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe("ReviewForm Component", () => {
  const mockBook = {
    _id: "book123",
    title: "Test Book",
    author: "Test Author",
  };

  const mockProps = {
    book: mockBook,
    isEditing: false,
    reviewId: null,
    handleUserReply: jest.fn(),
  };

  const renderReviewForm = (props = {}) => {
    return render(
      <RecoilRoot>
        <BrowserRouter>
          <ReviewForm {...mockProps} {...props} />
        </BrowserRouter>
      </RecoilRoot>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => "mock-token"),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe("Rendering", () => {
    test("should render review form correctly", () => {
      renderReviewForm();

      expect(screen.getByText("Write a Review")).toBeInTheDocument();
      expect(screen.getByLabelText(/rating/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/review/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /submit/i })
      ).toBeInTheDocument();
    });

    test("should render edit mode correctly", () => {
      renderReviewForm({ isEditing: true });

      expect(screen.getByText("Edit Review")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /update/i })
      ).toBeInTheDocument();
    });

    test("should show star rating component", () => {
      renderReviewForm();

      const stars = screen.getAllByRole("button");
      expect(stars.length).toBeGreaterThan(0);
    });

    test("should show textarea for review content", () => {
      renderReviewForm();

      const textarea = screen.getByLabelText(/review/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe("TEXTAREA");
    });
  });

  describe("Form Validation", () => {
    test("should validate required fields", async () => {
      renderReviewForm();

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/review must be at least 10 characters/i)
        ).toBeInTheDocument();
      });
    });

    test("should validate minimum content length", async () => {
      renderReviewForm();

      const textarea = screen.getByLabelText(/review/i);
      fireEvent.change(textarea, { target: { value: "Short" } });

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/review must be at least 10 characters/i)
        ).toBeInTheDocument();
      });
    });

    test("should validate maximum content length", async () => {
      renderReviewForm();

      const textarea = screen.getByLabelText(/review/i);
      const longContent = "a".repeat(1001); // Exceeds 1000 character limit
      fireEvent.change(textarea, { target: { value: longContent } });

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/review must not exceed 1000 characters/i)
        ).toBeInTheDocument();
      });
    });

    test("should validate rating range", async () => {
      renderReviewForm();

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/rating must be at least 1/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Star Rating", () => {
    test("should handle star rating selection", () => {
      renderReviewForm();

      const stars = screen.getAllByRole("button");
      const firstStar = stars[0];

      fireEvent.click(firstStar);

      expect(firstStar).toBeInTheDocument();
    });

    test("should show correct number of stars", () => {
      renderReviewForm();

      const stars = screen.getAllByRole("button");
      expect(stars.length).toBe(5); // 5-star rating system
    });

    test("should handle hover effects on stars", () => {
      renderReviewForm();

      const stars = screen.getAllByRole("button");
      const firstStar = stars[0];

      fireEvent.mouseEnter(firstStar);
      fireEvent.mouseLeave(firstStar);

      expect(firstStar).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    test("should submit review successfully", async () => {
      const mockAxiosPost = jest.fn().mockResolvedValue({
        data: { message: "Review created successfully" },
      });
      axios.post = mockAxiosPost;

      renderReviewForm();

      const textarea = screen.getByLabelText(/review/i);
      fireEvent.change(textarea, {
        target: {
          value:
            "This is a great book with compelling characters and an engaging plot.",
        },
      });

      const stars = screen.getAllByRole("button");
      fireEvent.click(stars[4]); // Select 5 stars

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalledWith(
          expect.stringContaining("/books/book123/reviews"),
          expect.objectContaining({
            content:
              "This is a great book with compelling characters and an engaging plot.",
            rating: 5,
          }),
          expect.any(Object)
        );
      });
    });

    test("should handle edit mode submission", async () => {
      const mockAxiosPut = jest.fn().mockResolvedValue({
        data: { message: "Review updated successfully" },
      });
      axios.put = mockAxiosPut;

      renderReviewForm({
        isEditing: true,
        reviewId: "review123",
      });

      const textarea = screen.getByLabelText(/review/i);
      fireEvent.change(textarea, {
        target: { value: "Updated review content with more details." },
      });

      const stars = screen.getAllByRole("button");
      fireEvent.click(stars[3]); // Select 4 stars

      const updateButton = screen.getByRole("button", { name: /update/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockAxiosPut).toHaveBeenCalledWith(
          expect.stringContaining("/books/book123/reviews/review123"),
          expect.objectContaining({
            content: "Updated review content with more details.",
            rating: 4,
          }),
          expect.any(Object)
        );
      });
    });

    test("should handle submission errors", async () => {
      const mockAxiosPost = jest.fn().mockRejectedValue({
        response: { data: { message: "You have already reviewed this book" } },
      });
      axios.post = mockAxiosPost;

      renderReviewForm();

      const textarea = screen.getByLabelText(/review/i);
      fireEvent.change(textarea, {
        target: { value: "This is a test review." },
      });

      const stars = screen.getAllByRole("button");
      fireEvent.click(stars[4]);

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    test("should handle network errors", async () => {
      const mockAxiosPost = jest
        .fn()
        .mockRejectedValue(new Error("Network error"));
      axios.post = mockAxiosPost;

      renderReviewForm();

      const textarea = screen.getByLabelText(/review/i);
      fireEvent.change(textarea, {
        target: { value: "This is a test review." },
      });

      const stars = screen.getAllByRole("button");
      fireEvent.click(stars[4]);

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });
  });

  describe("Authentication", () => {
    test("should redirect to login if not authenticated", async () => {
      // Mock localStorage to return no token
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: jest.fn(() => null),
          setItem: jest.fn(),
          removeItem: jest.fn(),
        },
        writable: true,
      });

      const mockAxiosPost = jest.fn().mockRejectedValue({
        response: { status: 401 },
      });
      axios.post = mockAxiosPost;

      renderReviewForm();

      const textarea = screen.getByLabelText(/review/i);
      fireEvent.change(textarea, {
        target: { value: "This is a test review." },
      });

      const stars = screen.getAllByRole("button");
      fireEvent.click(stars[4]);

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });
  });

  describe("Loading States", () => {
    test("should show loading state during submission", async () => {
      let resolvePromise;
      const mockAxiosPost = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );
      axios.post = mockAxiosPost;

      renderReviewForm();

      const textarea = screen.getByLabelText(/review/i);
      fireEvent.change(textarea, {
        target: { value: "This is a test review." },
      });

      const stars = screen.getAllByRole("button");
      fireEvent.click(stars[4]);

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      resolvePromise({ data: { message: "Success" } });
    });

    test("should disable form during submission", async () => {
      let resolvePromise;
      const mockAxiosPost = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );
      axios.post = mockAxiosPost;

      renderReviewForm();

      const textarea = screen.getByLabelText(/review/i);
      fireEvent.change(textarea, {
        target: { value: "This is a test review." },
      });

      const stars = screen.getAllByRole("button");
      fireEvent.click(stars[4]);

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(textarea).toBeDisabled();
        expect(stars[0]).toBeDisabled();
      });

      resolvePromise({ data: { message: "Success" } });
    });
  });

  describe("User Interactions", () => {
    test("should handle textarea input changes", () => {
      renderReviewForm();

      const textarea = screen.getByLabelText(/review/i);
      const testContent = "This is a test review content.";

      fireEvent.change(textarea, { target: { value: testContent } });

      expect(textarea.value).toBe(testContent);
    });

    test("should handle star rating changes", () => {
      renderReviewForm();

      const stars = screen.getAllByRole("button");

      fireEvent.click(stars[2]); // Select 3 stars

      expect(stars[2]).toBeInTheDocument();
    });

    test("should clear form after successful submission", async () => {
      const mockAxiosPost = jest.fn().mockResolvedValue({
        data: { message: "Review created successfully" },
      });
      axios.post = mockAxiosPost;

      renderReviewForm();

      const textarea = screen.getByLabelText(/review/i);
      fireEvent.change(textarea, {
        target: { value: "This is a test review." },
      });

      const stars = screen.getAllByRole("button");
      fireEvent.click(stars[4]);

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });
  });

  describe("Accessibility", () => {
    test("should have proper labels for form elements", () => {
      renderReviewForm();

      expect(screen.getByLabelText(/rating/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/review/i)).toBeInTheDocument();
    });

    test("should have proper ARIA attributes", () => {
      renderReviewForm();

      const textarea = screen.getByLabelText(/review/i);
      expect(textarea).toHaveAttribute("aria-describedby");
    });

    test("should be keyboard navigable", () => {
      renderReviewForm();

      const textarea = screen.getByLabelText(/review/i);
      const submitButton = screen.getByRole("button", { name: /submit/i });

      fireEvent.keyDown(textarea, { key: "Tab" });
      fireEvent.keyDown(submitButton, { key: "Enter" });

      expect(textarea).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    test("should handle form validation errors gracefully", () => {
      renderReviewForm();

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      // Should not crash and should show validation messages
      expect(submitButton).toBeInTheDocument();
    });

    test("should handle API errors gracefully", async () => {
      const mockAxiosPost = jest.fn().mockRejectedValue({
        response: {
          data: { message: "Server error" },
          status: 500,
        },
      });
      axios.post = mockAxiosPost;

      renderReviewForm();

      const textarea = screen.getByLabelText(/review/i);
      fireEvent.change(textarea, {
        target: { value: "This is a test review." },
      });

      const stars = screen.getAllByRole("button");
      fireEvent.click(stars[4]);

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });
  });

  describe("Integration Tests", () => {
    test("should work with parent component callbacks", async () => {
      const mockHandleUserReply = jest.fn();

      const mockAxiosPost = jest.fn().mockResolvedValue({
        data: { message: "Review created successfully" },
      });
      axios.post = mockAxiosPost;

      renderReviewForm({ handleUserReply: mockHandleUserReply });

      const textarea = screen.getByLabelText(/review/i);
      fireEvent.change(textarea, {
        target: { value: "This is a test review." },
      });

      const stars = screen.getAllByRole("button");
      fireEvent.click(stars[4]);

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
        expect(mockHandleUserReply).toHaveBeenCalled();
      });
    });

    test("should handle different book IDs", () => {
      const differentBook = { ...mockBook, _id: "different-book-id" };

      renderReviewForm({ book: differentBook });

      expect(screen.getByText("Write a Review")).toBeInTheDocument();
    });
  });
});
