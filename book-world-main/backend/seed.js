const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Book = require("./models/books");

// Load environment variables from .env
dotenv.config();

// Connect to your MongoDB
mongoose
  .connect(process.env.MONGO_URL || "mongodb://localhost:27017/bookworld", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("Connection error:", err));

// Sample data (replace this with full array of 30)
const sampleBooks = [
  {
    _id: "6883a001c776856dbce1d100",
    title: "The White Tiger",
    description:
      "A gripping tale of a man's journey from rural darkness to entrepreneurial light.",
    author: "Aravind Adiga",
    image_url:
      "https://res.cloudinary.com/demo/image/upload/v1720000001/book-world/white-tiger.jpg",
    genre: ["Drama", "Social Commentary"],
    year_published: 2008,
    __v: 0,
  },
  {
    _id: "6883a002c776856dbce1d101",
    title: "Midnight's Children",
    description:
      "An epic chronicle of India’s birth told through the lives of magical children born at midnight.",
    author: "Salman Rushdie",
    image_url:
      "https://res.cloudinary.com/demo/image/upload/v1720000002/book-world/midnights-children.jpg",
    genre: ["Historical", "Magical Realism"],
    year_published: 1981,
    __v: 0,
  },
  {
    _id: "6883a003c776856dbce1d102",
    title: "The God of Small Things",
    description:
      "A haunting tale of family secrets and forbidden love in Kerala.",
    author: "Arundhati Roy",
    image_url:
      "https://res.cloudinary.com/demo/image/upload/v1720000003/book-world/god-of-small-things.jpg",
    genre: ["Literary Fiction", "Drama"],
    year_published: 1997,
    __v: 0,
  },
  {
    _id: "6883a004c776856dbce1d103",
    title: "Train to Pakistan",
    description:
      "A powerful portrayal of human tragedy during the Partition of India.",
    author: "Khushwant Singh",
    image_url:
      "https://res.cloudinary.com/demo/image/upload/v1720000004/book-world/train-to-pakistan.jpg",
    genre: ["Historical", "Political"],
    year_published: 1956,
    __v: 0,
  },
  {
    _id: "6883a005c776856dbce1d104",
    title: "A Suitable Boy",
    description:
      "An epic saga of love, family, and politics in post-independence India.",
    author: "Vikram Seth",
    image_url:
      "https://res.cloudinary.com/demo/image/upload/v1720000005/book-world/suitable-boy.jpg",
    genre: ["Romance", "Historical Fiction"],
    year_published: 1993,
    __v: 0,
  },
  {
    _id: "6883a006c776856dbce1d105",
    title: "The Inheritance of Loss",
    description:
      "A novel exploring the complex themes of identity, migration, and colonial legacy.",
    author: "Kiran Desai",
    image_url:
      "https://res.cloudinary.com/demo/image/upload/v1720000006/book-world/inheritance-of-loss.jpg",
    genre: ["Drama", "Political"],
    year_published: 2006,
    __v: 0,
  },
  {
    _id: "6883a007c776856dbce1d106",
    title: "The Immortals of Meluha",
    description:
      "A mythological retelling of Lord Shiva's transformation into a legend.",
    author: "Amish Tripathi",
    image_url:
      "https://res.cloudinary.com/demo/image/upload/v1720000007/book-world/immortals-of-meluha.jpg",
    genre: ["Mythology", "Fantasy"],
    year_published: 2010,
    __v: 0,
  },
  {
    _id: "6883a008c776856dbce1d107",
    title: "Chanakya's Chant",
    description:
      "A modern political thriller inspired by the wit and wisdom of Chanakya.",
    author: "Ashwin Sanghi",
    image_url:
      "https://res.cloudinary.com/demo/image/upload/v1720000008/book-world/chanakyas-chant.jpg",
    genre: ["Thriller", "Historical Fiction"],
    year_published: 2011,
    __v: 0,
  },
  {
    _id: "6883a009c776856dbce1d108",
    title: "The Zoya Factor",
    description: "A humorous blend of cricket, luck, and romance.",
    author: "Anuja Chauhan",
    image_url:
      "https://res.cloudinary.com/demo/image/upload/v1720000009/book-world/zoya-factor.jpg",
    genre: ["Romantic Comedy", "Contemporary"],
    year_published: 2008,
    __v: 0,
  },
  {
    _id: "6883a00ac776856dbce1d109",
    title: "Serious Men",
    description:
      "A satirical look at class, ambition, and the power of ideas in modern India.",
    author: "Manu Joseph",
    image_url:
      "https://res.cloudinary.com/demo/image/upload/v1720000010/book-world/serious-men.jpg",
    genre: ["Satire", "Drama"],
    year_published: 2010,
    __v: 0,
  },

  // 20 more...

  {
    _id: "6883a01ac776856dbce1d120",
    title: "Palace of Illusions",
    description: "A retelling of the Mahabharata from Draupadi’s perspective.",
    author: "Chitra Banerjee Divakaruni",
    image_url:
      "https://res.cloudinary.com/demo/image/upload/v1720000020/book-world/palace-of-illusions.jpg",
    genre: ["Mythology", "Feminist Fiction"],
    year_published: 2008,
    __v: 0,
  },
  {
    _id: "6883a01bc776856dbce1d121",
    title: "The Lowland",
    description:
      "A moving story of two brothers torn by politics and personal ambitions.",
    author: "Jhumpa Lahiri",
    image_url:
      "https://res.cloudinary.com/demo/image/upload/v1720000021/book-world/the-lowland.jpg",
    genre: ["Literary", "Family"],
    year_published: 2013,
    __v: 0,
  },
  {
    _id: "6883a01cc776856dbce1d122",
    title: "The Alchemy of Desire",
    description:
      "A passionate and intense journey through love, obsession, and longing.",
    author: "Tarun J. Tejpal",
    image_url:
      "https://res.cloudinary.com/demo/image/upload/v1720000022/book-world/alchemy-of-desire.jpg",
    genre: ["Romance", "Psychological"],
    year_published: 2006,
    __v: 0,
  },
];

async function seedBooks() {
  try {
    await Book.deleteMany({}); // Clear existing books (optional)
    await Book.insertMany(sampleBooks);
    console.log("Books inserted successfully!");
  } catch (err) {
    console.error("Error inserting books:", err);
  } finally {
    mongoose.connection.close();
  }
}

seedBooks();
