const mongoose = require("mongoose");

const crypto = require("crypto");

const Joi = require("joi");

const jwt = require("jsonwebtoken");

const userScehma = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        minlength: [3, "Name must be at least 3 characters"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        pattern: [
            /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
            "PLEASE ENTER VALID EMAIL",
        ],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [5, "Password must be at least 5 characters"],
    },
    country: {
        type: String,
        required: [true, "Country is required"],
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

userScehma.methods.payload = function() {
    return jwt.sign({
        _id: this._id
    }, process.env.PRIVATE_KEY);
};

//Generate And Hash Pasword  Token.....
userScehma.methods.getResetPasswordToken = function() {
    // Create The Token.....
    const resetToken = crypto.randomBytes(20).toString('hex');
    //Hash The Token and can Set it to resetPasswordToken Field.......
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    return resetToken;
}


function validateUser(user) {
    const schema = Joi.object({
        name: Joi.string().required().min(3).max(255),
        email: Joi.string().required().email(),
        password: Joi.string().required().min(3).max(1300),
        country: Joi.string().required(),
    });
    const result = schema.validate(user);
    return result;
}

const User = mongoose.model("User", userScehma);

module.exports.User = User;
module.exports.validateUser = validateUser;