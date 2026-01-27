const User = require("../models/user.js");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
}

module.exports.signupUser = async (req, res, next) => {
    try{
        let { username, email, password } = req.body;
        const newUser = new User({email, username });
        const registeredUser = await User.register(newUser, password);
        // automatically log in the user after signing up
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to the Basera!");
            res.redirect("/listings");
        });
    }catch(e){
        req.flash("error", e.message);
        res.redirect("/signup");
    }
}

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
}

module.exports.loginUser = (req, res) => {
    req.flash("success", "Welcome Back!");
    res.redirect(res.locals.redirectUrl || "/listings");
    // || '/listings' because when directly logging in from /login there is no redirectUrl saved in session
}

module.exports.logoutUser = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You logged out!");
        res.redirect("/listings");
    });
}
