const { ObjectId } = require("mongodb");
const Unit = require("../models/unitModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const User = require("./../models/userModel");
const multer = require("multer");
const APIFeatures = require("../utils/apiFeatures");
const { trySending } = require("../utils/email");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/users");
  },
  filename: (req, file, cb) => {
    const extension = file.mimetype.split("/")[1];
    cb(null, `user-${Date.now()}.${extension}`);
  }
});

/**Testing a unique kind of a file which you expect being uploaded */
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image") || file.type.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image!.Please upload only images", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single("photo");

/**Handler functions */
/**Handler funciton for getting all Users */

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const users = await features.query.populate("unit");

  res.status(200).json({
    status: "success",
    items: users.length,
    data: {
      data: users
    }
  });
});

/**Handler function for creating a user (THIS FUNCTIONALITY WILL BE FOR ADMINS/CARETAKERS NOT TENANTS THEMSELVES) */
exports.createUser = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
    gender: req.body.gender
  });

  /**When a new user is created the user should be sent an email with the user login details */
  const optionsObj = {
    email: [newUser.email],
    subject: "NEW USER LOGIN DETAILS",
    message: `Hello ${newUser.firstName} ,
    Please use this login details to login to your account and update your password.

    EMAIL : ${newUser.email}
    PASSWORD : testuser1234
    `
  };

  const response = await trySending(optionsObj);

  res.status(201).json({
    status: "success",
    data: {
      data: newUser
    }
  });
});

/**Handler funciton for getting a user */
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate("payments");

  res.status(200).json({
    status: "success",
    data: user
  });
});

/**Handler function for updating user data */
exports.updateUser = catchAsync(async (req, res, next) => {
  let queryObj = "";

  if (req.file) {
    queryObj = { ...req.body, photo: req.file.filename };
  } else {
    queryObj = req.body;
  }

  const filteredQueryObj = Object.fromEntries(
    Object.entries(queryObj).filter(
      ([__dirname, value]) =>
        value !== "" && value !== null && value !== undefined
    )
  );

  const updateQuery = { $set: { ...filteredQueryObj } };

  const updatedUser = await User.findByIdAndUpdate(req.params.id, updateQuery, {
    new: true
  });

  res.status(200).json({
    status: "success",
    data: {
      data: updatedUser
    }
  });
});

/**Handler function for deleting a user */
exports.deleteUser = catchAsync(async (req, res, next) => {
  /**Deleting a user is basically setting the active status to false */
  const user = await User.findById(req.params.id);

  if (!req.params.id) {
    user.active = "false";
    await user.save();

    res.status(204).json({
      status: "success",
      data: null
    });
  } else {
    user.active = "false";
    user.unit = undefined;
    await user.save();

    /**If user was assigned a unit,we need to find that unit and set the tenant value to undefined */
    if (req.body.unitId) {
      const unit = await Unit.findById(req.body.unitId);

      unit.tenant = undefined;
      unit.vacant = true;
      await unit.save();
      console.log(unit);
    }

    res.status(204).json({
      status: "success",
      data: null
    });
  }
});

exports.assignUnitTenant = catchAsync(async (req, res, next) => {
  /**First we need to check whether the user exists and is active and is a tenant */
  const user = await User.findById(req.body.tenantId);

  if (user.role !== "tenant") {
    return next(new AppError("You can only assign tenants a unit!", 400));
  }

  user.unit = undefined;
  await user.save();
  await Unit.updateOne({ _id: user.unit }, { $set: { vacant: true } });

  const unit = await Unit.findById(req.body.unit);

  if (unit.tenant && unit.tenant.toString() !== req.body.tenantId.toString()) {
    return next(
      new AppError("This unit is already assigned to another tenant!", 400)
    );
  }

  /**Update the unit's data */
  const updatedUser = await User.findOneAndUpdate(
    { _id: { $eq: req.body.tenantId } },
    { $set: { paidRent: req.body.paidRent, unit: req.body.unit } },
    {
      runValidators: true
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      updatedUser
    }
  });
});

exports.sendCommunication = catchAsync(async (req, res, next) => {
  if (req.body.commMethod === "email") {
    const optionsObj = {
      email: req.body.tenantemail,
      subject: req.body.subject,
      message: req.body.message
    };

    await trySending(optionsObj);

    res.status(200).json({
      status: "success",
      message: "Successfully sent email."
    });
  }
});
