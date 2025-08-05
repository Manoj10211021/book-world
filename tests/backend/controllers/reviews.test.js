const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../backend/index");
const Book = require("../../backend/models/books");
const User = require("../../backend/models/users");
const Review = require("../../backend/models/review");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

describe("Reviews Controller", () => {
  let userToken, adminToken, testUser, testAdmin, testBook, testReview;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(
      process.env.MONGO_TEST_URL || "mongodb://localhost:27017/book-world-test"
    );

    // Create test admin user
    testAdmin = new User({
      firstName: "Admin",
      lastName: "User",
      email: "admin@test.com",
      password: await bcrypt.hash("password123", 10),
      role: "admin",
    });
    await testAdmin.save();
    adminToken = jwt.sign(
      { userId: testAdmin._id },
      process.env.JWT_SECRET || "test-secret"
    );

    // Create test regular user
    testUser = new User({
      firstName: "Regular",
      lastName: "User",
      email: "user@test.com",
      password: await bcrypt.hash("password123", 10),
      role: "user",
    });
    await testUser.save();
    userToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || "test-secret"
    );

    // Create test book
    testBook = new Book({
      title: "Test Book",
      author: "Test Author",
      description: "A test book",
      genre: ["Fiction"],
      year_published: 2024,
      averageRating: 0,
      totalReviews: 0,
    });
    await testBook.save();
  });

  beforeEach(async () => {
    // Clear reviews collection before each test
    await Review.deleteMany({});

    // Reset book rating stats
    testBook.averageRating = 0;
    testBook.totalReviews = 0;
    await testBook.save();
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Book.deleteMany({});
    await Review.deleteMany({});
    await mongoose.connection.close();
  });

  describe("GET /books/:bookId/reviews", () => {
    test("should get all reviews for a book", async () => {
      // Create test reviews
      const review1 = new Review({
        userId: testUser._id,
        bookId: testBook._id,
        content: "Great book!",
        rating: 5,
      });
      await review1.save();

      const review2 = new Review({
        userId: testAdmin._id,
        bookId: testBook._id,
        content: "Good book",
        rating: 4,
      });
      await review2.save();

      const response = await request(app)
        .get(`/books/${testBook._id}/reviews`)
        .expect(200);

      expect(response.body.reviews).toBeDefined();
      expect(Array.isArray(response.body.reviews)).toBe(true);
      expect(response.body.reviews.length).toBe(2);
    });

    test("should return empty array for book with no reviews", async () => {
      const response = await request(app)
        .get(`/books/${testBook._id}/reviews`)
        .expect(200);

      expect(response.body.reviews).toBeDefined();
      expect(response.body.reviews.length).toBe(0);
    });

    test("should return 404 for non-existent book", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/books/${fakeId}/reviews`)
        .expect(404);

      expect(response.body.message).toBe("Book not found");
    });
  });

  describe("POST /books/:bookId/reviews", () => {
    test("should create a new review", async () => {
      const reviewData = {
        content: "Excellent book with compelling characters.",
        rating: 5,
      };

      const response = await request(app)
        .post(`/books/${testBook._id}/reviews`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(reviewData)
        .expect(200);

      expect(response.body.message).toBe("Review created successfully");
      expect(response.body.review).toBeDefined();
      expect(response.body.review.content).toBe(reviewData.content);
      expect(response.body.review.rating).toBe(reviewData.rating);
      expect(response.body.review.userId).toBe(testUser._id.toString());

      // Verify book rating stats are updated
      const updatedBook = await Book.findById(testBook._id);
      expect(updatedBook.averageRating).toBe(5);
      expect(updatedBook.totalReviews).toBe(1);
    });

    test("should reject duplicate review from same user", async () => {
      // Create initial review
      const review = new Review({
        userId: testUser._id,
        bookId: testBook._id,
        content: "First review",
        rating: 4,
      });
      await review.save();

      const reviewData = {
        content: "Second review attempt",
        rating: 5,
      };

      const response = await request(app)
        .post(`/books/${testBook._id}/reviews`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.message).toContain(
        "You have already reviewed this book"
      );
    });

    test("should reject unauthenticated requests", async () => {
      const reviewData = {
        content: "Test review",
        rating: 4,
      };

      const response = await request(app)
        .post(`/books/${testBook._id}/reviews`)
        .send(reviewData)
        .expect(401);

      expect(response.body.message).toBe("You need to Login to write a review");
    });

    test("should validate required fields", async () => {
      const response = await request(app)
        .post(`/books/${testBook._id}/reviews`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain("validation failed");
    });

    test("should validate rating range", async () => {
      const reviewData = {
        content: "Test review",
        rating: 6, // Invalid rating
      };

      const response = await request(app)
        .post(`/books/${testBook._id}/reviews`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.message).toContain("validation failed");
    });

    test("should validate content length", async () => {
      const reviewData = {
        content: "Short", // Too short
        rating: 4,
      };

      const response = await request(app)
        .post(`/books/${testBook._id}/reviews`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.message).toContain("validation failed");
    });

    test("should return 404 for non-existent book", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const reviewData = {
        content: "Test review",
        rating: 4,
      };

      const response = await request(app)
        .post(`/books/${fakeId}/reviews`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(reviewData)
        .expect(404);

      expect(response.body.message).toBe("Book not found");
    });
  });

  describe("GET /books/:bookId/reviews/me", () => {
    test("should get user review for book", async () => {
      // Create user review
      const review = new Review({
        userId: testUser._id,
        bookId: testBook._id,
        content: "My review",
        rating: 4,
      });
      await review.save();

      const response = await request(app)
        .get(`/books/${testBook._id}/reviews/me`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.content).toBe("My review");
      expect(response.body.rating).toBe(4);
    });

    test("should return null for no user review", async () => {
      const response = await request(app)
        .get(`/books/${testBook._id}/reviews/me`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toBeNull();
    });

    test("should reject unauthenticated requests", async () => {
      const response = await request(app)
        .get(`/books/${testBook._id}/reviews/me`)
        .expect(401);
    });
  });

  describe("PUT /books/:bookId/reviews/:reviewId", () => {
    beforeEach(async () => {
      // Create test review
      testReview = new Review({
        userId: testUser._id,
        bookId: testBook._id,
        content: "Original review",
        rating: 3,
      });
      await testReview.save();
    });

    test("should update user review", async () => {
      const updateData = {
        content: "Updated review content",
        rating: 5,
      };

      const response = await request(app)
        .put(`/books/${testBook._id}/reviews/${testReview._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe("Review updated successfully");
      expect(response.body.review.content).toBe(updateData.content);
      expect(response.body.review.rating).toBe(updateData.rating);

      // Verify book rating stats are updated
      const updatedBook = await Book.findById(testBook._id);
      expect(updatedBook.averageRating).toBe(5);
    });

    test("should reject updating other user review", async () => {
      const updateData = {
        content: "Unauthorized update",
        rating: 5,
      };

      const response = await request(app)
        .put(`/books/${testBook._id}/reviews/${testReview._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(401);

      expect(response.body.message).toBe(
        "You are not authorized to update this review"
      );
    });

    test("should reject unauthenticated requests", async () => {
      const updateData = {
        content: "Unauthorized update",
        rating: 5,
      };

      const response = await request(app)
        .put(`/books/${testBook._id}/reviews/${testReview._id}`)
        .send(updateData)
        .expect(401);
    });

    test("should return 404 for non-existent review", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = {
        content: "Updated content",
        rating: 4,
      };

      const response = await request(app)
        .put(`/books/${testBook._id}/reviews/${fakeId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBe("Review not found");
    });
  });

  describe("DELETE /books/:bookId/reviews/:reviewId", () => {
    beforeEach(async () => {
      // Create test review
      testReview = new Review({
        userId: testUser._id,
        bookId: testBook._id,
        content: "Review to delete",
        rating: 4,
      });
      await testReview.save();
    });

    test("should delete user review", async () => {
      const response = await request(app)
        .delete(`/books/${testBook._id}/reviews/${testReview._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.message).toBe("Review deleted successfully");

      // Verify review is deleted
      const deletedReview = await Review.findById(testReview._id);
      expect(deletedReview).toBeNull();

      // Verify book rating stats are updated
      const updatedBook = await Book.findById(testBook._id);
      expect(updatedBook.totalReviews).toBe(0);
    });

    test("should reject deleting other user review", async () => {
      const response = await request(app)
        .delete(`/books/${testBook._id}/reviews/${testReview._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(401);

      expect(response.body.message).toBe(
        "You are not authorized to delete this review"
      );
    });

    test("should reject unauthenticated requests", async () => {
      const response = await request(app)
        .delete(`/books/${testBook._id}/reviews/${testReview._id}`)
        .expect(401);
    });

    test("should return 404 for non-existent review", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/books/${testBook._id}/reviews/${fakeId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.message).toBe("Review not found");
    });
  });

  describe("POST /books/:bookId/reviews/:reviewId/like", () => {
    beforeEach(async () => {
      // Create test review
      testReview = new Review({
        userId: testUser._id,
        bookId: testBook._id,
        content: "Test review",
        rating: 4,
      });
      await testReview.save();
    });

    test("should like a review", async () => {
      const response = await request(app)
        .post(`/books/${testBook._id}/reviews/${testReview._id}/like`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe("Review liked successfully");

      // Verify like is added
      const updatedReview = await Review.findById(testReview._id);
      expect(updatedReview.likes).toContain(testAdmin._id);
    });

    test("should unlike a review if already liked", async () => {
      // First like the review
      testReview.likes.push(testAdmin._id);
      await testReview.save();

      const response = await request(app)
        .post(`/books/${testBook._id}/reviews/${testReview._id}/like`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe("Review unliked successfully");

      // Verify like is removed
      const updatedReview = await Review.findById(testReview._id);
      expect(updatedReview.likes).not.toContain(testAdmin._id);
    });

    test("should reject unauthenticated requests", async () => {
      const response = await request(app)
        .post(`/books/${testBook._id}/reviews/${testReview._id}/like`)
        .expect(401);
    });

    test("should return 404 for non-existent review", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/books/${testBook._id}/reviews/${fakeId}/like`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.message).toBe("Review not found");
    });
  });

  describe("Rating Calculations", () => {
    test("should calculate average rating correctly", async () => {
      // Create multiple reviews
      const reviews = [
        { rating: 5, content: "Excellent" },
        { rating: 4, content: "Good" },
        { rating: 3, content: "Average" },
        { rating: 5, content: "Great" },
        { rating: 2, content: "Poor" },
      ];

      for (let i = 0; i < reviews.length; i++) {
        const review = new Review({
          userId: new mongoose.Types.ObjectId(),
          bookId: testBook._id,
          content: reviews[i].content,
          rating: reviews[i].rating,
        });
        await review.save();
      }

      // Verify book stats are updated
      const updatedBook = await Book.findById(testBook._id);
      expect(updatedBook.averageRating).toBe(3.8); // (5+4+3+5+2)/5 = 3.8
      expect(updatedBook.totalReviews).toBe(5);
    });

    test("should handle single review rating", async () => {
      const review = new Review({
        userId: testUser._id,
        bookId: testBook._id,
        content: "Single review",
        rating: 4,
      });
      await review.save();

      const updatedBook = await Book.findById(testBook._id);
      expect(updatedBook.averageRating).toBe(4);
      expect(updatedBook.totalReviews).toBe(1);
    });

    test("should handle review deletion rating recalculation", async () => {
      // Create multiple reviews
      const review1 = new Review({
        userId: testUser._id,
        bookId: testBook._id,
        content: "Review 1",
        rating: 5,
      });
      await review1.save();

      const review2 = new Review({
        userId: testAdmin._id,
        bookId: testBook._id,
        content: "Review 2",
        rating: 3,
      });
      await review2.save();

      // Delete one review
      await Review.findByIdAndDelete(review1._id);

      // Verify book stats are recalculated
      const updatedBook = await Book.findById(testBook._id);
      expect(updatedBook.averageRating).toBe(3);
      expect(updatedBook.totalReviews).toBe(1);
    });
  });
});
