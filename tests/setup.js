// Jest setup file for Book World Application Tests

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.MONGO_TEST_URL = "mongodb://localhost:27017/book-world-test";
process.env.VITE_BACKEND_URL = "http://localhost:5000";

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "mocked-url");

// Mock URL.revokeObjectURL
global.URL.revokeObjectURL = jest.fn();

// Mock crypto for JWT
Object.defineProperty(global, "crypto", {
  value: {
    getRandomValues: jest.fn(() => new Uint8Array(32)),
  },
});

// Suppress specific warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOM.render is no longer supported")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global test timeout
jest.setTimeout(10000);

// Mock axios defaults
jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
  defaults: {
    headers: {
      common: {},
    },
  },
}));

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: "/test" }),
  useParams: () => ({}),
}));

// Mock recoil
jest.mock("recoil", () => ({
  RecoilRoot: ({ children }) => children,
  atom: jest.fn(),
  selector: jest.fn(),
  useRecoilState: jest.fn(() => [null, jest.fn()]),
  useRecoilValue: jest.fn(() => null),
  useSetRecoilState: jest.fn(() => jest.fn()),
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    promise: jest.fn(),
  },
}));

// Mock react-hook-form
jest.mock("react-hook-form", () => ({
  useForm: jest.fn(() => ({
    register: jest.fn(),
    handleSubmit: jest.fn((fn) => fn),
    formState: { errors: {} },
    reset: jest.fn(),
    setValue: jest.fn(),
    watch: jest.fn(() => ({})),
    getValues: jest.fn(() => ({})),
    setError: jest.fn(),
    clearErrors: jest.fn(),
  })),
}));

// Mock cloudinary
jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(() =>
        Promise.resolve({ secure_url: "https://test-image.jpg" })
      ),
    },
  },
}));

// Mock multer
jest.mock("multer", () => {
  const multer = () => {
    return {
      single: jest.fn(() => (req, res, next) => next()),
      array: jest.fn(() => (req, res, next) => next()),
      fields: jest.fn(() => (req, res, next) => next()),
    };
  };
  multer.memoryStorage = jest.fn(() => ({}));
  return multer;
});

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn(() => Promise.resolve("hashed-password")),
  compare: jest.fn(() => Promise.resolve(true)),
  genSalt: jest.fn(() => Promise.resolve("salt")),
}));

// Mock jsonwebtoken
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "mock-jwt-token"),
  verify: jest.fn(() => ({ userId: "mock-user-id" })),
}));

// Mock mongoose
jest.mock("mongoose", () => ({
  connect: jest.fn(() => Promise.resolve()),
  connection: {
    close: jest.fn(() => Promise.resolve()),
  },
  Types: {
    ObjectId: jest.fn(() => "mock-object-id"),
  },
}));

// Mock supertest
jest.mock("supertest", () => {
  return jest.fn(() => ({
    get: jest.fn(() => ({
      expect: jest.fn(() => ({ body: {} })),
    })),
    post: jest.fn(() => ({
      send: jest.fn(() => ({
        expect: jest.fn(() => ({ body: {} })),
      })),
      set: jest.fn(() => ({
        send: jest.fn(() => ({
          expect: jest.fn(() => ({ body: {} })),
        })),
      })),
    })),
    put: jest.fn(() => ({
      send: jest.fn(() => ({
        expect: jest.fn(() => ({ body: {} })),
      })),
      set: jest.fn(() => ({
        send: jest.fn(() => ({
          expect: jest.fn(() => ({ body: {} })),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      expect: jest.fn(() => ({ body: {} })),
      set: jest.fn(() => ({
        expect: jest.fn(() => ({ body: {} })),
      })),
    })),
  }));
});

// Setup test database connection
beforeAll(async () => {
  // Setup test database if needed
  console.log("Setting up test environment...");
});

afterAll(async () => {
  // Cleanup test database if needed
  console.log("Cleaning up test environment...");
});

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    _id: "mock-user-id",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    password: "hashed-password",
    role: "user",
    ...overrides,
  }),

  createMockBook: (overrides = {}) => ({
    _id: "mock-book-id",
    title: "Test Book",
    author: "Test Author",
    description: "Test description",
    genre: ["Fiction"],
    year_published: 2024,
    image_url: "https://test-image.jpg",
    averageRating: 4.5,
    totalReviews: 10,
    ...overrides,
  }),

  createMockReview: (overrides = {}) => ({
    _id: "mock-review-id",
    userId: "mock-user-id",
    bookId: "mock-book-id",
    content: "Test review content",
    rating: 5,
    likes: [],
    ...overrides,
  }),

  createMockToken: () => "mock-jwt-token",
};
