if(process.env.NODE_ENV !== "production"){
  require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require('ejs-mate');
const methodOverride = require("method-override");
const ExpressErr = require("./utils/ExpressErr.js");
const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const session = require("express-session");
const MongoStore = require('connect-mongo').default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");


main()
  .then(() => { console.log("connected to DB"); })
  .catch((err) => { console.log(err); });

async function main() {
  // await mongoose.connect(process.env.MONGO_URL); for local hosting
  await mongoose.connect(process.env.ATLASDB_URL);
}

const mongoStore = MongoStore.create({
  mongoUrl: process.env.ATLASDB_URL,
  crypto:{
    secret: process.env.SECRET
  },
  touchAfter: 24 * 60 * 60
});

const sessionOptions = {
  store: mongoStore,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookies: {
    expires: Date.now() * 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  }
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// we are saving the message in locals which are accessible in all the templates when using req.render
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  next();
})


app.use("/listings", listingsRouter)
app.use("/listings/:id/reviews", reviewsRouter)
app.use("/", userRouter);


app.all("*", (req, res, next) => {
  throw new ExpressErr(404, "Page not found");
});

// Error handling middleware
app.use((err, req, res, next) => {
  let { status = 404, message = "Something went wrong" } = err;
  res.status(status).render("listings/error.ejs", { message })
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});