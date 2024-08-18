import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import passport from "passport";
import dotenv from "dotenv";
import { Strategy as DiscordStrategy } from "passport-discord";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../"); 
const envFilePath = path.join(rootDir, ".env");
dotenv.config({ path: envFilePath });


passport.use (new DiscordStrategy({
  clientID: `${process.env.DiscordClientID}`,
  clientSecret: `${process.env.DiscordSecret}`,
  callbackURL: 'https://gabrielgsd.developer.li/auth/discord/callback',
  scope: ['identify', 'guilds']
},
async function (accessToken, refreshToken, profile, done) {
  try {
    const readUsers = () => {
        const userPath = path.join(__dirname, "../json/users.json");
        const userData = fs.readFileSync(userPath);
        return JSON.parse(userData);
    }
    const users = readUsers();
    if(users.some(u => u.userid === profile.id)) {
        return done(null, profile);
    }
    const guildID = process.env.DiscordGuildID;
    const isMember = profile.guilds.some(guild => guild.id === guildID);
    if (!isMember) {
      return done(null, false, { message: 'No eres miembro del servidor, contacta con @gabrielgsdci en Discord para acceder al servidor'})
    }
    return done(null, profile);
    } catch (error) {
      return done(error);
    }
}));



passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

export default passport;