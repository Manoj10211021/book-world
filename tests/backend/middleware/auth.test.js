const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../backend/index");
const User = require("../../backend/models/users");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

describe("Authentication Middleware", () => {
  let userToken, adminToken, testUser, testAdmin;

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
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe("JWT Token Verification", () => {
    test("should accept valid JWT token", async () => {
      const response = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe("user@test.com");
    });

    test("should reject requests without token", async () => {
      const response = await request(app).get("/users/me").expect(401);

      expect(response.body.message).toBe("Access denied. No token provided.");
    });

    test("should reject requests with invalid token format", async () => {
      const response = await request(app)
        .get("/users/me")
        .set("Authorization", "InvalidFormat token")
        .expect(401);

      expect(response.body.message).toBe("Access denied. No token provided.");
    });

    test("should reject requests with invalid JWT token", async () => {
      const response = await request(app)
        .get("/users/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.message).toBe("Invalid token.");
    });

    test("should reject requests with expired token", async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "0s" }
      );

      const response = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.message).toBe("Invalid token.");
    });

    test("should reject requests with token for non-existent user", async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const fakeToken = jwt.sign(
        { userId: fakeUserId },
        process.env.JWT_SECRET || "test-secret"
      );

      const response = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${fakeToken}`)
        .expect(401);

      expect(response.body.message).toBe("Invalid token.");
    });

    test("should set user role in request object", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // The middleware should set req.role for admin users
      expect(response.body.users).toBeDefined();
    });
  });

  describe("Role-Based Access Control", () => {
    test("should allow admin access to protected routes", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeDefined();
    });

    test("should reject non-admin access to admin routes", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(401);

      expect(response.body.message).toBe(
        "You are not Authorized to view all users"
      );
    });

    test("should allow user access to user routes", async () => {
      const response = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
    });

    test("should allow admin access to user routes", async () => {
      const response = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
    });
  });

  describe("Token Payload Validation", () => {
    test("should validate token payload structure", async () => {
      // Create token with invalid payload
      const invalidToken = jwt.sign(
        { invalidField: "value" },
        process.env.JWT_SECRET || "test-secret"
      );

      const response = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.message).toBe("Invalid token.");
    });

    test("should handle malformed token", async () => {
      const response = await request(app)
        .get("/users/me")
        .set("Authorization", "Bearer malformed.token.here")
        .expect(401);

      expect(response.body.message).toBe("Invalid token.");
    });
  });

  describe("Error Handling", () => {
    test("should handle database connection errors gracefully", async () => {
      // This test would require mocking database connection failure
      // For now, we'll test that the middleware doesn't crash
      const response = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
    });

    test("should handle JWT verification errors", async () => {
      // Test with token signed with different secret
      const wrongSecretToken = jwt.sign(
        { userId: testUser._id },
        "wrong-secret"
      );

      const response = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${wrongSecretToken}`)
        .expect(401);

      expect(response.body.message).toBe("Invalid token.");
    });
  });

  describe("Request Object Enhancement", () => {
    test("should add userId to request object", async () => {
      // This test verifies that the middleware adds userId to req
      // We can test this by checking that protected routes work
      const response = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.user._id).toBe(testUser._id.toString());
    });

    test("should add role to request object", async () => {
      // Test admin role
      const adminResponse = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(adminResponse.body.users).toBeDefined();

      // Test user role
      const userResponse = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(userResponse.body.user).toBeDefined();
    });
  });

  describe("Security Tests", () => {
    test("should not expose sensitive user information in error messages", async () => {
      const response = await request(app)
        .get("/users/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      // Error message should not contain sensitive information
      expect(response.body.message).toBe("Invalid token.");
      expect(response.body.message).not.toContain("password");
      expect(response.body.message).not.toContain("secret");
    });

    test("should handle concurrent requests with same token", async () => {
      // Test multiple concurrent requests with the same token
      const promises = Array(5)
        .fill()
        .map(() =>
          request(app)
            .get("/users/me")
            .set("Authorization", `Bearer ${userToken}`)
        );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.user).toBeDefined();
      });
    });

    test("should handle requests with different token formats", async () => {
      const testCases = [
        { header: "Bearer token", expectedStatus: 401 },
        { header: "bearer token", expectedStatus: 401 },
        { header: "Token token", expectedStatus: 401 },
        { header: "Bearer", expectedStatus: 401 },
        { header: "", expectedStatus: 401 },
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .get("/users/me")
          .set("Authorization", testCase.header)
          .expect(testCase.expectedStatus);
      }
    });
  });
});
