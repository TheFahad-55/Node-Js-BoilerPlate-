const mongoose = require('mongoose');

async function conn() {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        if (conn) {
            console.log(`Connected To The ${conn.connection.host}`.bgMagenta);

        }
    } catch (err) {
        console.log(err.message, err.stack);

    }






}


module.exports.conn = conn;