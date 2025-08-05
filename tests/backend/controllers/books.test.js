const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../backend/index");
const Book = require("../../backend/models/books");
const User = require("../../backend/models/users");
const Review = require("../../backend/models/review");
const jwt = require("jsonwebtoken");

describe("Books Controller", () => {
  let adminToken, userToken, testBook, testUser, testAdmin;

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
      password: "password123",
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
      password: "password123",
      role: "user",
    });
    await testUser.save();
    userToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || "test-secret"
    );
  });

  beforeEach(async () => {
    // Clear books collection before each test
    await Book.deleteMany({});

    // Create test book
    testBook = new Book({
      title: "Test Book",
      author: "Test Author",
      description: "A test book description",
      genre: ["Fiction", "Test"],
      year_published: 2024,
      image_url: "https://test-image.jpg",
    });
    await testBook.save();
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Book.deleteMany({});
    await Review.deleteMany({});
    await mongoose.connection.close();
  });

  describe("GET /books", () => {
    test("should get all books", async () => {
      const response = await request(app).get("/books").expect(200);

      expect(response.body.books).toBeDefined();
      expect(Array.isArray(response.body.books)).toBe(true);
      expect(response.body.books.length).toBe(1);
      expect(response.body.books[0].title).toBe("Test Book");
    });

    test("should search books by query", async () => {
      const response = await request(app).get("/books?q=Test").expect(200);

      expect(response.body.books.length).toBe(1);
      expect(response.body.books[0].title).toBe("Test Book");
    });

    test("should return empty array for no matches", async () => {
      const response = await request(app)
        .get("/books?q=Nonexistent")
        .expect(200);

      expect(response.body.books.length).toBe(0);
    });
  });

  describe("GET /books/:id", () => {
    test("should get book by id", async () => {
      const response = await request(app)
        .get(`/books/${testBook._id}`)
        .expect(200);

      expect(response.body.book).toBeDefined();
      expect(response.body.book.title).toBe("Test Book");
      expect(response.body.book.author).toBe("Test Author");
    });

    test("should return 404 for non-existent book", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/books/${fakeId}`).expect(404);
    });

    test("should return 400 for invalid id format", async () => {
      const response = await request(app).get("/books/invalid-id").expect(400);
    });
  });

  describe("POST /books", () => {
    test("should create book as admin", async () => {
      const bookData = {
        title: "New Book",
        author: "New Author",
        description: "A new book description",
        genre: ["Fiction"],
        year_published: 2024,
      };

      const response = await request(app)
        .post("/books")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("title", bookData.title)
        .field("author", bookData.author)
        .field("description", bookData.description)
        .field("genre", JSON.stringify(bookData.genre))
        .field("year_published", bookData.year_published)
        .attach("file", Buffer.from("fake-image"), "test.jpg")
        .expect(200);

      expect(response.body.book).toBeDefined();
      expect(response.body.book.title).toBe(bookData.title);
      expect(response.body.message).toContain("New Book: New Book Added");
    });

    test("should reject non-admin users", async () => {
      const bookData = {
        title: "New Book",
        author: "New Author",
      };

      const response = await request(app)
        .post("/books")
        .set("Authorization", `Bearer ${userToken}`)
        .send(bookData)
        .expect(401);

      expect(response.body.message).toBe("You are not Authorized to Add Book");
    });

    test("should reject unauthenticated requests", async () => {
      const bookData = {
        title: "New Book",
        author: "New Author",
      };

      const response = await request(app)
        .post("/books")
        .send(bookData)
        .expect(401);
    });

    test("should validate required fields", async () => {
      const response = await request(app)
        .post("/books")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });
  });

  describe("PUT /books/:id", () => {
    test("should update book as admin", async () => {
      const updateData = {
        title: "Updated Book",
        author: "Updated Author",
      };

      const response = await request(app)
        .put(`/books/${testBook._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("title", updateData.title)
        .field("author", updateData.author)
        .expect(200);

      expect(response.body.current.title).toBe(updateData.title);
      expect(response.body.current.author).toBe(updateData.author);
      expect(response.body.message).toBe("Book Updated");
    });

    test("should reject non-admin users", async () => {
      const updateData = {
        title: "Updated Book",
      };

      const response = await request(app)
        .put(`/books/${testBook._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(updateData)
        .expect(401);

      expect(response.body.message).toBe(
        "You are not Authorized to Update a Book"
      );
    });

    test("should return 404 for non-existent book", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = { title: "Updated Book" };

      const response = await request(app)
        .put(`/books/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe("DELETE /books/:id", () => {
    test("should delete book as admin", async () => {
      const response = await request(app)
        .delete(`/books/${testBook._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.book.title).toBe("Test Book");
      expect(response.body.message).toContain("Book Deleted: Test Book");

      // Verify book is deleted
      const deletedBook = await Book.findById(testBook._id);
      expect(deletedBook).toBeNull();
    });

    test("should reject non-admin users", async () => {
      const response = await request(app)
        .delete(`/books/${testBook._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(401);

      expect(response.body.message).toBe(
        "You are not Authorized to Delete a Book"
      );
    });

    test("should return 404 for non-existent book", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/books/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });

    test("should delete associated reviews and user favorites", async () => {
      // Create a review for the book
      const review = new Review({
        userId: testUser._id,
        bookId: testBook._id,
        content: "Test review",
        rating: 5,
      });
      await review.save();

      // Add book to user favorites
      testUser.favoriteBooks.push(testBook._id);
      await testUser.save();

      // Delete the book
      await request(app)
        .delete(`/books/${testBook._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // Verify review is deleted
      const deletedReview = await Review.findById(review._id);
      expect(deletedReview).toBeNull();

      // Verify book is removed from user favorites
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.favoriteBooks).not.toContain(testBook._id);
    });
  });
});
