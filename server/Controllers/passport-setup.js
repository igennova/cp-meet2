import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../Models/user.js';
import { UserRating } from '../Models/rating.js';
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

            // Initialize user rating
            const newRating = new UserRating({
                userId: newUser._id,
                ratings: {
                    BLITZ_2MIN: {
                        current: 1000,
                        peak: 1000,
                        matches: 0
                    },
                    RAPID_8MIN: {
                        current: 1000,
                        peak: 1000,
                        matches: 0
                    },
                    CLASSIC_12MIN: {
                        current: 1000,
                        peak: 1000,
                        matches: 0
                    }
                },
                overall: {
                    wins: 0,
                    losses: 0,
                    winRate: 0
                }
            });
            await newRating.save();

            done(null, newUser);
        } catch (err) {
            done(err, null);
        }
    })
); 