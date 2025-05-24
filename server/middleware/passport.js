import passport from "passport";

const passportMiddleware = (app) => {
  app.use(passport.initialize());
  app.use(passport.session());
};

export default passportMiddleware; 