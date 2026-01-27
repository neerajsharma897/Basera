const express = require("express");
const router = express.Router();
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/user.js");

//signup route
router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signupUser));

//login route
router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(saveRedirectUrl, passport.authenticate("local", {failureFlash: true, failureRedirect: "/login"}), userController.loginUser);

//logout route
router
  .route("/logout")
  .get(userController.logoutUser); 

module.exports = router;