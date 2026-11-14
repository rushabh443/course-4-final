const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// Helper route: returns the raw book data. The routes below call it with Axios.
public_users.get('/booksdb', (req, res) => {
  return res.status(200).json(books);
});

// Register a new user
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (!isValid(username)) {
    return res.status(409).json({ message: "User already exists" });
  }
  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Get all books (Axios + async/await)
public_users.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/booksdb`);
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving books" });
  }
});

// Get book details by ISBN (Axios + Promise callbacks)
public_users.get('/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  axios.get(`${BASE_URL}/booksdb`)
    .then((response) => {
      const book = response.data[isbn];
      if (book) {
        return res.status(200).json(book);
      }
      return res.status(404).json({ message: "Book not found" });
    })
    .catch(() => res.status(500).json({ message: "Error retrieving book" }));
});

// Get books by author (Axios + async/await)
public_users.get('/author/:author', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/booksdb`);
    const author = req.params.author.toLowerCase();
    const result = Object.keys(response.data)
      .filter((key) => response.data[key].author.toLowerCase() === author)
      .map((key) => ({ isbn: key, ...response.data[key] }));
    if (result.length === 0) {
      return res.status(404).json({ message: "No books found for this author" });
    }
    return res.status(200).json({ booksbyauthor: result });
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving books" });
  }
});

// Get books by title (Axios + Promise callbacks)
public_users.get('/title/:title', (req, res) => {
  const title = req.params.title.toLowerCase();
  axios.get(`${BASE_URL}/booksdb`)
    .then((response) => {
      const result = Object.keys(response.data)
        .filter((key) => response.data[key].title.toLowerCase() === title)
        .map((key) => ({ isbn: key, ...response.data[key] }));
      if (result.length === 0) {
        return res.status(404).json({ message: "No books found with this title" });
      }
      return res.status(200).json({ booksbytitle: result });
    })
    .catch(() => res.status(500).json({ message: "Error retrieving books" }));
});

// Get book reviews
public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }
  return res.status(200).json(book.reviews);
});

module.exports.general = public_users;
