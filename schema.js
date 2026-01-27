const Joi = require('joi');

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required().min(1).max(40),
        description: Joi.string().required().max(500),
        price: Joi.number().required().min(1),
        location: Joi.string().required(),
        country: Joi.string().required(),
        image: Joi.string().allow("", null),
    }).required(),
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required(),   // rating is required
        comment: Joi.string().required(),  // comment is required, but you're not sending it
    }).required(),
});


