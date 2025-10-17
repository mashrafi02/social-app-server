const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_CONNECTION_STR, {
}).then(() => {
    console.log("atlas server connection has been established");
}).catch(err => {
    console.log(err.name, err.message);
    console.log('Unhandled rejection occurred! App is shutting down');
    process.exit(1)
})

const db = mongoose.connection

module.exports = db