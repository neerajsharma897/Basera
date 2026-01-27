const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listing.js");


//Index Route & Create Route
router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post( isLoggedIn, validateListing, wrapAsync(listingController.createListing));


//New Route
router
  .route("/new")
  .get(isLoggedIn, listingController.renderListingForm);


//Show Route , Update Route & Delete Route 
router
  .route("/:id") 
  .get(wrapAsync(listingController.showListing))
  .put(isLoggedIn, isOwner, validateListing, wrapAsync(listingController.updateListing))
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.deleteListing));


//Edit Route
router
  .route("/:id/edit")
  .get(isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));


module.exports = router;