const Interest = require("../models/Interest");
const catchAsync = require("../utils/catchAsync");


exports.addInterest = catchAsync(async (req, res,next) => {
  const { name, icon } = req.body;
    console.log(req.body);
    const interest = await Interest.create({ name, icon });
    res.status(201).json({
      status: "success",
      data: {
        interest,
      },
    });
}
);

// get interests

exports.getInterests = catchAsync(async (req, res,next) => {
  const interests = await Interest.find();
  res.status(200).json({
    status: "success",
    data: {
      interests,
    },
  });
}
);