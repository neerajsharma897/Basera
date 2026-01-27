const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const ExpressErr = require("./utils/ExpressErr.js");
const { listingSchema, reviewSchema } = require("./schema.js");
 

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        if (req.method === "GET") {
            req.session.redirectUrl = req.originalUrl;
        } else {
            // For non-GET, redirect to parent resource or referer
            req.session.redirectUrl = req.get("Referer") || "/listings";
        }
        req.flash("error", "You must be logged in to access that page");
        return res.redirect("/login");
    }
    next();
};

/* middleware to save redirect url to res.locals for access in templates because req.session is not directly 
   accessible in ejs templates and passport deletes req.user after the response is sent*/

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;  
    }
    next();
};

// thsi middleware to check if the logged in user is the owner of the listing
module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing.owner.equals(req.user._id)) {
        req.flash("error", "You do not have permission to do that");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    console.log(error);
    throw new ExpressErr(400, errMsg);
  } else {
    next();
  }
};

module.exports.validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",")
    throw new ExpressErr(400, errMsg)
  } else {
    next();
  }
};

// middleware to check if the logged in user is the author of the review and allow deletion
module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) {
        req.flash("error", "You do not have permission to do that");
        return res.redirect(`/listings/${id}`);
    }
    next();
};
