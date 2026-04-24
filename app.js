require("dotenv").config();
const connectDB = require("./config/db");
const express = require("express");
const app = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("iZen E-commerce running");
});

app.listen(process.env.PORT, ()  => {
    console.log("Server running on port 3000");
});