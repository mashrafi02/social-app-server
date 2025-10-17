const dotenv = require('dotenv');
dotenv.config({path:'./config.env'});
const app = require('./app');

process.on('uncaughtException', (err) => {
    console.log(err.name, err.message, err);
    console.log('Unhandled exceptoin occurred! App is shutting down');
    process.exit(1)
})

const dbConfig = require('./config/mongoConfig');

const port = parseInt(process.env.PORT) || 3000

app.listen(port, () => {
    console.log('server is running at port: ' + port)
})

process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    console.log('Unhandled rejection occurred! App is shutting down');

    server.close(() => {
        process.exit(1)
    })
})