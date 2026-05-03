const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

//Configure Google OAuth2 strategy with credentials from .env
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        //Check if user already exists with this Google account
        let existingUser = await User.findOne({ email: profile.emails[0].value });

        if (existingUser) {
          //If user exists just return it
          return done(null, existingUser);
        }

        //If user does not exist create a new with Google data
        const newUser = await User.create({
          username: profile.displayName,
          email: profile.emails[0].value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          authProvider: "google",
          status: "pending", //KAN-73 Google user need verify email too
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;