process.on("uncaughtException", (err) => {
    console.log(err.message, err.stack);
});

process.on("unhandledRejection", (err) => {
    console.log(err.message, err.stack);
});