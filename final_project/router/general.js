const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

function slugify(str) {
    str = str.replace(/^\s+|\s+$/g, ''); // trim leading/trailing white space
    str = str.toLowerCase(); // convert string to lowercase
    str = str.replace(/[^a-z0-9 -]/g, '') // remove any non-alphanumeric characters
             .replace(/\s+/g, '-') // replace spaces with hyphens
             .replace(/-+/g, '-'); // remove consecutive hyphens
    return str;
}

public_users.post("/register", (req, res) => {
  const {username, password} = req.body

  console.log(username)

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const userExists = users.find(u => u.username === username);
  if (userExists) {
    return res.status(409).json({ message: "User already exists" });
  }

  users.push({ username, password });
  return res.status(201).json({ message: "User registered successfully" });
});

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
    try {
        const bookList = await Promise.resolve(books);
        return res.send(JSON.stringify(bookList, null, 4))
    } catch (error) {
        return res.status(500).json({message: 'Books list not found', error: error.message})
    }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
  try {
    const bookList = await Promise.resolve(books);
    const isbn = req.params.isbn; // No need for await here
    const out = bookList[isbn];
    
    if (!out) {
      return res.status(404).json({message: 'Book not found'});
    }
    
    return res.send(JSON.stringify(out, null, 4))
  } catch (error) {
    return res.status(500).json({message: 'Error fetching book', error: error.message})
  }
});

// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  try {
    const bookList = await Promise.resolve(books);
    const author = slugify(req.params.author); // No need for await here
    const out = []

    for (b in bookList) {
      if (slugify(bookList[b].author) === author) {
        out.push(bookList[b])
      }
    }
    
    if (out.length === 0) {
      return res.status(404).json({message: "Author not found"})
    }
    
    return res.send(JSON.stringify(out, null, 4))
  } catch (error) {
    return res.status(500).json({message: 'Error finding author', error: error.message})
  }
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) { // Added async here
  try {
    const bookList = await Promise.resolve(books);
    const title = slugify(req.params.title); // No need for await here
    const out = []

    for (b in bookList) {
      if (slugify(bookList[b].title) === title) {
        out.push(bookList[b])
      }
    }
    
    if (out.length === 0) {
      return res.status(404).json({message: "Title not found"}) // Fixed error message
    }
    
    return res.send(JSON.stringify(out, null, 4))
  } catch (error) {
    return res.status(500).json({message: 'Error finding title', error: error.message})
  }
});

// Get book review
public_users.get('/review/:isbn', async function (req, res) {
  try {
    const book = await Promise.resolve(books[req.params.isbn]);
    
    if (!book) {
      return res.status(404).json({message: 'Book not found'});
    }
    
    return res.send(JSON.stringify(book.reviews, null, 4))
  } catch (error) {
    return res.status(500).json({message: 'Error fetching reviews', error: error.message})
  }
});

module.exports.general = public_users;