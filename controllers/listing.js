const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
  const Listings = await Listing.find({});
  res.render("listings/index.ejs", { Listings });
};

module.exports.renderListingForm = (req, res) => {
  res.render("listings/new.ejs");
}

module.exports.createListing = async (req, res) => {
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  await newListing.save();
  req.flash("success", "New Listing Created");
  res.redirect("/listings");
}

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  // add reviews and owner to listings
  // const listing = await Listing.findById(id).populate("reviews").populate("owner"); this was good for only one level of population
  const listing = await Listing.findById(id).populate({path: "reviews", populate: {path: "author"}}).populate("owner");
  // in above line we are populating author inside reviews which is inside listing
  if (!listing) {
    req.flash("error", "Listing you requested doesn't exist");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
}

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested doesn't exist");
    return res.redirect("/listings");
  }
  res.render("listings/edit.ejs", { listing });
}

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  req.flash("success", "Listing Updated");
  res.redirect(`/listings/${id}`);
}

module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", " Listing Deleted");
  res.redirect("/listings");
}