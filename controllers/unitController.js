const Unit = require("../models/unitModel");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

/**Routes for handling unit CRUD OPERATIONS */
exports.getUnit = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);

    res.status(200).json({
      status: "success",
      data: {
        data: unit
      }
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "failed",
      data: err
    });
  }
};

exports.createUnit = catchAsync(async (req, res, next) => {
  const unit = await Unit.create({
    unitType: req.body.unitType,
    apartmentUnit: req.body.apartmentUnit,
    unitNum: req.body.unitNum,
    floor: req.body.floor,
    status: req.body.status,
    description: req.body.description
  });

  res.status(201).json({
    status: "success",
    data: unit
  });
});

exports.updateUnit = async (req, res) => {
  try {
    console.log(req.body, req.params);

    const unitId = req.params.id;

    const updatedunit = await Unit.findByIdAndUpdate(
      unitId,
      { $set: { ...req.body } },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      data: updatedunit
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "failed",
      data: err
    });
  }
};

exports.getAllUnits = async (req, res) => {
  try {
    const response = new APIFeatures(Unit.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const units = await response.query;

    res.status(200).json({
      status: "success",
      items: units.length,
      data: units
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "failed",
      data: err
    });
  }
};

exports.deleteUnit = catchAsync(async (req, res, next) => {
  try {
    /**We can not delete   a unit if it is assigned a user*/
    const unit = await Unit.findById(req.params.id);

    if (!unit.vacant) {
      return next(new AppError("This unit is occupied by a tenant.", 400));
    }

    await unit.deleteOne();

    res.status(204).json({
      status: "success",
      message: "Successfuly deleted unit"
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "failed",
      data: err
    });
  }
});
