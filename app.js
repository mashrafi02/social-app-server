const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const globalErrorHandler = require('./utils/globalErrorHandler');


const limiter = rateLimit({
    max: 1000,
    windowMs: 60 * 60 * 1000,
    message: 'We have recieved too many request from you. Please try again after 1 hour'
})

const app = express();

app.use(helmet());

const allowedOrigins = [process.env.CLIENT_URL];

app.use(cors({
              origin: function(origin, callback) {
                if (!origin || allowedOrigins.includes(origin)) {
                  callback(null, true);
                } else {
                  callback(new Error("Not allowed by CORS"));
                }
              },
              credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(compression());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));


const globalErrorController = require('./controllers/globalErrorController');
const authRouter = require('./routes/authRoutes');

app.use('/api', limiter);
app.use('/api/v1/auth', authRouter);


app.use((req,res,next) => {
    const err = new globalErrorHandler(`Can't find ${req.originalUrl} on the server!`, 404);
    next(err)
})

app.use(globalErrorController);



module.exports = app;