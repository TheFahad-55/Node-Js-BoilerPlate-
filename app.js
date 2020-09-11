const express = require("express");

const cors = require("cors");

const app = express();

const morgan = require("morgan");

const usersRoutes = require("./routes/users");

const authRoutes = require("./routes/auth");

const mongoSanitize = require("express-mongo-sanitize");

const helmet = require("helmet");

const xss = require("xss-clean");

const rateLimit = require("express-rate-limit");

const hpp = require("hpp");

require("colors");

require("./startup/error");

//DOTENV CONFIGURATION.....
require("dotenv").config({
    path: "./config/.env",
});

require("./config/db").conn();

const error = require("./middleware/error");

//PREVENT CROS SIDE SCRIPTING.....
app.use(xss());

//CROSS SITE RESOURCE SHARING....
app.use(cors());

//PREVENT SQL NOSQL INJECTION........
app.use(mongoSanitize());

//SET SECURITY HEADERS.......

app.use(helmet());

//RATE LIMITING........
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 1000, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

//PREVENT HTTP PARAMS POLLUTION.....
app.use(hpp());

//BODY PARSER.......{JSON,FORM-DATA}
app.use(express.json());
app.use(
    express.urlencoded({
        extended: true,
    })
);

if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

//ROUTESSSSS........
app.use("/api/users", usersRoutes);
app.use("/api/auth", authRoutes);

//Error Middleware........
app.use(error);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Listening On The Server ${port}`.bgMagenta);
});