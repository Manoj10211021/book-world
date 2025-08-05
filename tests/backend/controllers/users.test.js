const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../backend/index");
const User = require("../../backend/models/users");
const Book = require("../../backend/models/books");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

describe("Users Controller", () => {
  let adminToken, userToken, testUser, testAdmin, testBook;

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
    });
    await testBook.save();
  });

  beforeEach(async () => {
    // Clear users collection before each test (except test users)
    await User.deleteMany({
      email: { $nin: ["admin@test.com", "user@test.com"] },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Book.deleteMany({});
    await mongoose.connection.close();
  });

  describe("POST /users/signup", () => {
    test("should register a new user", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/users/signup")
        .send(userData)
        .expect(200);

      expect(response.body.message).toBe("User registered successfully");
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.role).toBe("user");
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned
    });

    test("should reject duplicate email", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "user@test.com", // Already exists
        password: "password123",
      };

      const response = await request(app)
        .post("/users/signup")
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain("Email already exists");
    });

    test("should validate required fields", async () => {
      const response = await request(app)
        .post("/users/signup")
        .send({})
        .expect(400);

      expect(response.body.message).toContain("validation failed");
    });

    test("should validate email format", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email",
        password: "password123",
      };

      const response = await request(app)
        .post("/users/signup")
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain("validation failed");
    });

    test("should validate password length", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        password: "123", // Too short
      };

      const response = await request(app)
        .post("/users/signup")
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain("validation failed");
    });
  });

  describe("POST /users/login", () => {
    test("should login with valid credentials", async () => {
      const loginData = {
        email: "user@test.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/users/login")
        .send(loginData)
        .expect(200);

      expect(response.body.message).toBe("Login successful");
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user.password).toBeUndefined();
    });

    test("should reject invalid email", async () => {
      const loginData = {
        email: "nonexistent@test.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/users/login")
        .send(loginData)
        .expect(400);

      expect(response.body.message).toContain("Invalid email or password");
    });

    test("should reject invalid password", async () => {
      const loginData = {
        email: "user@test.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/users/login")
        .send(loginData)
        .expect(400);

      expect(response.body.message).toContain("Invalid email or password");
    });

    test("should validate required fields", async () => {
      const response = await request(app)
        .post("/users/login")
        .send({})
        .expect(400);

      expect(response.body.message).toContain("validation failed");
    });
  });

  describe("POST /users/google-auth", () => {
    test("should authenticate with valid Google token", async () => {
      // Mock Google OAuth verification
      const mockGoogleToken = "valid-google-token";

      const response = await request(app)
        .post("/users/google-auth")
        .send({
          token: mockGoogleToken,
          auth_method: "google",
        })
        .expect(200);

      expect(response.body.message).toBe("Google authentication successful");
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    test("should create new user for new Google account", async () => {
      const mockGoogleToken = "new-google-token";

      const response = await request(app)
        .post("/users/google-auth")
        .send({
          token: mockGoogleToken,
          auth_method: "google",
        })
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.auth_method).toBe("google");
    });

    test("should reject invalid Google token", async () => {
      const response = await request(app)
        .post("/users/google-auth")
        .send({
          token: "invalid-token",
          auth_method: "google",
        })
        .expect(400);

      expect(response.body.message).toContain("Invalid Google token");
    });
  });

  describe("GET /users/me", () => {
    test("should get current user profile", async () => {
      const response = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe("user@test.com");
      expect(response.body.user.password).toBeUndefined();
    });

    test("should reject unauthenticated requests", async () => {
      const response = await request(app).get("/users/me").expect(401);

      expect(response.body.message).toBe("Access denied. No token provided.");
    });

    test("should reject invalid token", async () => {
      const response = await request(app)
        .get("/users/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.message).toBe("Invalid token.");
    });
  });

  describe("GET /users", () => {
    test("should get all users as admin", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeDefined();
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    test("should reject non-admin users", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(401);

      expect(response.body.message).toBe(
        "You are not Authorized to view all users"
      );
    });

    test("should reject unauthenticated requests", async () => {
      const response = await request(app).get("/users").expect(401);
    });
  });

  describe("GET /users/:userId", () => {
    test("should get user by id", async () => {
      const response = await request(app)
        .get(`/users/${testUser._id}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe("user@test.com");
      expect(response.body.user.password).toBeUndefined();
    });

    test("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/users/${fakeId}`).expect(404);

      expect(response.body.message).toBe("User not found");
    });

    test("should return 400 for invalid id format", async () => {
      const response = await request(app).get("/users/invalid-id").expect(400);
    });
  });

  describe("PUT /users/favourites", () => {
    test("should add book to favorites", async () => {
      const response = await request(app)
        .put("/users/favourites")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ bookId: testBook._id })
        .expect(200);

      expect(response.body.message).toBe("Book added to favourites");

      // Verify book is added to user favorites
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.favoriteBooks).toContain(testBook._id);
    });

    test("should remove book from favorites if already favorited", async () => {
      // First add book to favorites
      testUser.favoriteBooks.push(testBook._id);
      await testUser.save();

      const response = await request(app)
        .put("/users/favourites")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ bookId: testBook._id })
        .expect(200);

      expect(response.body.message).toBe("Book removed from favourites");

      // Verify book is removed from user favorites
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.favoriteBooks).not.toContain(testBook._id);
    });

    test("should reject unauthenticated requests", async () => {
      const response = await request(app)
        .put("/users/favourites")
        .send({ bookId: testBook._id })
        .expect(401);
    });

    test("should return 404 for non-existent book", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put("/users/favourites")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ bookId: fakeId })
        .expect(404);

      expect(response.body.message).toBe("Book not found");
    });
  });

  describe("GET /users/favourites", () => {
    test("should get user favorite books", async () => {
      // Add book to user favorites
      testUser.favoriteBooks.push(testBook._id);
      await testUser.save();

      const response = await request(app)
        .get("/users/favourites")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.books).toBeDefined();
      expect(Array.isArray(response.body.books)).toBe(true);
      expect(response.body.books.length).toBe(1);
      expect(response.body.books[0]._id).toBe(testBook._id.toString());
    });

    test("should return empty array for no favorites", async () => {
      const response = await request(app)
        .get("/users/favourites")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.books).toBeDefined();
      expect(response.body.books.length).toBe(0);
    });

    test("should reject unauthenticated requests", async () => {
      const response = await request(app).get("/users/favourites").expect(401);
    });
  });

  describe("PUT /users/:userId/promote", () => {
    test("should promote user to admin", async () => {
      const response = await request(app)
        .put(`/users/${testUser._id}/promote`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe("User promoted to admin");

      // Verify user role is updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.role).toBe("admin");
    });

    test("should reject non-admin users", async () => {
      const response = await request(app)
        .put(`/users/${testUser._id}/promote`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(401);

      expect(response.body.message).toBe(
        "You are not Authorized to promote users"
      );
    });

    test("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/users/${fakeId}/promote`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.message).toBe("User not found");
    });
  });

  describe("POST /users/:userId/report", () => {
    test("should report user", async () => {
      const reportData = {
        reason: "Inappropriate behavior",
        description: "User violated community guidelines",
      };

      const response = await request(app)
        .post(`/users/${testUser._id}/report`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(reportData)
        .expect(200);

      expect(response.body.message).toBe("User reported successfully");
    });

    test("should reject reporting self", async () => {
      const reportData = {
        reason: "Test reason",
        description: "Test description",
      };

      const response = await request(app)
        .post(`/users/${testUser._id}/report`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(reportData)
        .expect(400);

      expect(response.body.message).toBe("You cannot report yourself");
    });

    test("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const reportData = {
        reason: "Test reason",
        description: "Test description",
      };

      const response = await request(app)
        .post(`/users/${fakeId}/report`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(reportData)
        .expect(404);

      expect(response.body.message).toBe("User not found");
    });
  });
});
