const Listing = require("../models/listing");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3 } = require("../cloudConfig.js");

function getUploadedImage(file) {
  return {
    url: file.location || file.path,
    filename: file.key || file.filename,
  };
}

async function getPresignedImageUrl(image) {
  if (!image || !image.filename || !process.env.S3_BUCKET_NAME) {
    return image;
  }

  const isAwsS3Image = image.filename.startsWith("basera/") || image.url?.includes(process.env.S3_BUCKET_NAME);
  if (!isAwsS3Image) {
    return image;
  }

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: image.filename,
  });

  return {
    ...image,
    url: await getSignedUrl(s3, command, { expiresIn: 60 * 10 }),
  };
}

async function attachPresignedImage(listing) {
  if (listing && listing.image) {
    listing.image = await getPresignedImageUrl(listing.image);
  }
  return listing;
}

module.exports.index = async (req, res) => {
  const { category } = req.query;
  let filter = {};
  if (category) {
    filter.category = category;
  }
  const Listings = await Listing.find(filter);
  await Promise.all(Listings.map((listing) => attachPresignedImage(listing)));
  res.render("listings/index.ejs", { Listings, currentCategory: category });
};

module.exports.renderListingForm = (req, res) => {
  res.render("listings/new.ejs");
}

module.exports.createListing = async (req, res) => {
  if (!req.file) {
    req.flash("error", "Image upload failed. Please try again.");
    return res.redirect("/listings/new");
  }

  const newListing = new Listing(req.body.listing);
  newListing.image = getUploadedImage(req.file);
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
  await attachPresignedImage(listing);
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
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });
  
  if (!listing) {
    req.flash("error", "Listing you requested doesn't exist");
    return res.redirect("/listings");
  }
  
  if (req.file) {
    listing.image = getUploadedImage(req.file);
    await listing.save();
  }
  
  req.flash("success", "Listing Updated");
  res.redirect(`/listings/${id}`);
}

module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findByIdAndDelete(id);
  
  if (!listing) {
    req.flash("error", "Listing you requested doesn't exist");
    return res.redirect("/listings");
  }
  
  req.flash("success", "Listing Deleted");
  res.redirect("/listings");
}