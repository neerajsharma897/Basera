const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
require('dotenv').config({ path: '../.env' });


main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});
  // Assigning a default owner to each listing
  initData.data.forEach(listing => {
    listing.owner = "6978b4bc7156d4fa1b3c8b2e"; 
  });
  await Listing.insertMany(initData.data);
  console.log("data was initialized");
};

initDB();