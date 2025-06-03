import passport from "passport";

const passportMiddleware = (app) => {
  passport.initialize();
  passport.session();
};

export default passportMiddleware; 