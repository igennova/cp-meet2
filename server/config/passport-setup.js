import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../Models/User.js';
import * as dotenv from 'dotenv';

dotenv.config();

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user);
        })
        .catch(err => {
            done(err, null);
        });
});

passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            const existingUser = await User.findOne({ googleId: profile.id });
            
            if (existingUser) {
                return done(null, existingUser);
            }

            // If not, create new user
            const newUser = await new User({
                googleId: profile.id,
                displayName: profile.displayName,
                email: profile.emails[0].value,
                profilePicture: profile.photos[0].value
            }).save();

            done(null, newUser);
        } catch (err) {
            done(err, null);
        }
    })
); 