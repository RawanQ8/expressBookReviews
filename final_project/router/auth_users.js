const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
//write code to check is the username is valid
if (!username) return false;

return users.some(u => u.username === username);
}

const authenticatedUser = (username, password) => {
    if (!username || !password) return false;
    return users.some(u => u.username === username && u.password === password);
  };

//only registered users can login
regd_users.post("/login", (req,res) => {
  //Write your code here
  const {username, password} = req.body
   // Check if username or password is missing
    if (!username || !password) {
        return res.status(404).json({ message: "Error logging in" });
    }
  if (!isValid(username)) {
    return res.status(404).json({"message": "Username is not valid"})
  }
  if(authenticatedUser(username, password)) {
     // ISSUE a JWT and stash it in the session
    const accessToken = jwt.sign({ username }, "access", { expiresIn: '24h' });
    if (!req.session) return res.status(500).json({ message: "Session not initialized" });

    req.session.authorization = { accessToken };
    return res.status(200).send("User successfully logged in");
  }
  return res.status(401).json({message: "Username and password don't match"});
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    console.log("REVIEW hit:", req.params.isbn, "user:", req.user, "body:", req.body);
    try {
      const { isbn } = req.params;
      const { review, rating } = req.body || {};

      const book = books[isbn];
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }

      if (!review || typeof review !== "string") {
        return res.status(400).json({ message: "Review text is required" });
      }

      // Prefer authenticated user from JWT/session; fallback to body for testing
      const username = (req.user && req.user.username) || req.body?.username;
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }

      // Ensure reviews is an object
      if (!book.reviews || typeof book.reviews !== "object" || Array.isArray(book.reviews)) {
        book.reviews = {};
      }
      // If a seed like { "review": "Good book" } exists, preserve it (optional)
      if (typeof book.reviews.review === "string") {
        book.reviews._seed = book.reviews.review;
        delete book.reviews.review;
      }

      // One review per user (upsert)
      book.reviews[username] = { review, rating };

      return res.status(200).json({ message: "Review saved", isbn, reviews: book.reviews });
    } catch (err) {
      console.error("PUT /auth/review error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;

    const username = (req.user && req.user.username) || req.body?.username;
    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    const book = books[isbn];
    if (!book) {
        return res.status(404).json({ message: "Book not found" });
    }

    if (book.reviews && book.reviews[username]) {
        delete book.reviews[username];
        return res.status(200).json({ message: "Review deleted successfully" });
    }

    return res.status(404).json({ message: "Review not found for this user" });

    
  });

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;