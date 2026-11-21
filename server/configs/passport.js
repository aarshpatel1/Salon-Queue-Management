import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

export const configurePassport = () => {
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'super_secret_jwt_key_branja_salon_2026_x7k9'
  };

  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        // Verify token payload
        if (jwt_payload && jwt_payload.role) {
          return done(null, jwt_payload);
        }
        return done(null, false);
      } catch (err) {
        return done(err, false);
      }
    })
  );
};

export default passport;
