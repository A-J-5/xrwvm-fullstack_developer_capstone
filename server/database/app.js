/*jshint esversion: 8 */
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3030;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Load seed data
const reviews_data = JSON.parse(fs.readFileSync("reviews.json", "utf8"));
const dealerships_data = JSON.parse(fs.readFileSync("dealerships.json", "utf8"));

// Mongo connection (Docker service name must match docker-compose)
mongoose.connect("mongodb://db_container:27017/dealershipsDB")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Models
const Reviews = require('./review');
const Dealerships = require('./dealership');

// ---------------- SEED DATABASE ----------------
const seedDatabase = async () => {
    try {
      const reviewCount = await Reviews.countDocuments();
      const dealerCount = await Dealerships.countDocuments();
  
      if (reviewCount === 0) {
        await Reviews.insertMany(reviews_data.reviews);
        console.log("Reviews seeded");
      } else {
        console.log("Reviews already present, skipping seed");
      }
  
      if (dealerCount === 0) {
        await Dealerships.insertMany(dealerships_data.dealerships);
        console.log("Dealerships seeded");
      } else {
        console.log("Dealerships already present, skipping seed");
      }
    } catch (error) {
      console.error("Seeding error:", error);
    }
  };

// Seed after connection is ready
mongoose.connection.once("open", () => {
  seedDatabase();
});

// ---------------- ROUTES ----------------

// Home
app.get('/', (req, res) => {
  res.send("Welcome to the Mongoose API");
});

// Fetch all reviews
app.get('/fetchReviews', async (req, res) => {
  try {
    const documents = await Reviews.find();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Error fetching reviews" });
  }
});

// Fetch reviews by dealer id
app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    const dealerId = parseInt(req.params.id);
    const documents = await Reviews.find({ dealership: dealerId });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Error fetching dealer reviews" });
  }
});

// Fetch all dealers
app.get('/fetchDealers', async (req, res) => {
  try {
    const documents = await Dealerships.find();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Error fetching dealers" });
  }
});

// Fetch dealers by state
app.get('/fetchDealers/:state', async (req, res) => {
  try {
    const documents = await Dealerships.find({
      state: req.params.state
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Error fetching dealers by state" });
  }
});

// Fetch dealer by ID
app.get('/fetchDealer/:id', async (req, res) => {
  try {
    const dealerId = parseInt(req.params.id);

    const document = await Dealerships.findOne({ id: dealerId });
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: "Error fetching dealer by id" });
  }
});

// Insert review
app.post('/insert_review', async (req, res) => {
    try {
      const data = req.body;

    const lastReview = await Reviews.findOne().sort({ id: -1 });
    const new_id = lastReview ? lastReview.id + 1 : 1;

    const review = new Reviews({
      id: new_id,
      name: data.name,
      dealership: data.dealership,
      review: data.review,
      purchase: data.purchase,
      purchase_date: data.purchase_date,
      car_make: data.car_make,
      car_model: data.car_model,
      car_year: data.car_year
    });

    const savedReview = await review.save();
    res.json(savedReview);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error inserting review" });
  }
});

// ---------------- START SERVER ----------------
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});