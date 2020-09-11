const express = require("express");

const router = express.Router();

const bcrypt = require("bcryptjs");

const _ = require("lodash");

const User = require("../models/User").User;

const validateUsers = require("../models/User").validateUser;

const asyncMiddleware = require("../middleware/async").asyncMiddleware;

const Joi = require("joi");

const crypto = require('crypto');

const auth = require("../middleware/auth");


const sendsEmail = require("../startup/email").sendEmail;

//VALIDATING  a USER...........
router.post(
    "",
    asyncMiddleware(async(req, res) => {
        const {
            error
        } = validateUser(req.body);
        if (error) {
            return res.status(400).send(error.details[0].message);
        }
        let user = await User.findOne({
            email: req.body.email,
        });
        if (!user) {
            return res.status(400).send("INVALID EMAIL OR PASSWORD");
        }

        const valid = await bcrypt.compare(req.body.password, user.password);

        if (!valid) {
            return res.status(400).send("INVALID EMAIL OR PASSWORD");
        }
        const token = user.payload();
        if (!token) {
            return res.status(500).send("INTERNAL SERVER ERROR");
        }
        res.status(200).send(token);
    })
);
//FORGOT PASSWORD....

router.post('/forgot-password', asyncMiddleware(async(req, res) => {
    const {
        error
    } = validateEmail(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }
    let user = await User.findOne({
        email: req.body.email,
    });
    if (!user) {
        return res.status(404).send("NO SUCH USER WITH THIS EMAIL");
    }
    const resetToken = user.getResetPasswordToken();
    await user.save();

    //CREATE RESET URL...........

    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/forgot-password/${resetToken}`;
    const message = `you are recieving this email because  (or someone else) has reuqested the reset of the password.
    Please Make A PUT Request To:\n\n ${resetUrl}`;
    try {
        await sendsEmail({
            subject: 'RESET PASSWORD',
            email: user.email,
            message: message
        });
    } catch (err) {
        console.log("COULD.NT SEND THE EMAIL", err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

    }
    res.status(200).send("EMAIL SENT");

}));

//update The Logged In (User)Credentials...

router.put('/update', auth, asyncMiddleware(async(req, res) => {
    const {
        error
    } = validateUsers(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    const id = req.user._id;
    let user = await User.findOne({
        _id: id
    });
    if (!user) {
        return res.status(404).send("User Not Found");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(req.body.password, salt);

    user.name = req.body.name;
    user.email = req.body.email;
    user.password = hashedPass;
    user.country = req.body.country;

    const result = await user.save();

    if (!result) {
        return res.status(500).send("INTERNAL SERVER ERROR");

    }
    res.status(201).send(_.pick(result, ["name", "email", "country"]));

}));





//RESET PASSWORD.........
router.put('/forgot-password/:token', asyncMiddleware(async(req, res) => {
    if (!req.params.token) {
        return res.status(400).send("NOT TOKEN PROVIDED");
    }
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    let user = await User.findOne({
        resetPasswordToken: resetPasswordToken,
        resetPasswordExpire: {
            $gt: Date.now()
        }
    });
    if (!user) {
        return res.status(400).send("INVALID TOKEN");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(req.body.password, salt);
    user.password = hashedPass;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = user.payload();
    if (!token) {
        return res.status(500).send("INTERNAL SERVER ERROR");
    }
    res.status(200).send(token);
}));

//get CURRENTLY LOGGEDN IN USER.............
router.get('/me', auth, asyncMiddleware(async(req, res) => {
    const id = req.user._id;
    let user = await User.findOne({
        _id: id
    });
    if (!user) {
        return res.staus(404).send("NOT FOUND");
    }

    res.status(200).send(user);
}));






function validateUser(user) {
    const schema = Joi.object({
        email: Joi.string().required().email(),
        password: Joi.string().required().min(3).max(1300),
    });
    const result = schema.validate(user);
    return result;
}

function validateEmail(email) {
    const schema = Joi.object({
        email: Joi.string().required().email(),
    });
    const result = schema.validate(email);
    return result;
}


module.exports = router;