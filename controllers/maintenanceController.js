const multer = require("multer");
const Maintenance = require("../models/maintenanceModel");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/maintenance");
  },
  filename: (req, file, cb) => {
    const extension = file.mimetype.split("/")[1];
    cb(null, `maintenance-${Date.now()}.${extension}`);
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

exports.uploadMaintenancePhoto = upload.single("photo");

/**Routes for handling maintenance Requests  CRUD OPERATIONS */
exports.getMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);

    res.status(200).json({
      status: "success",
      data: {
        data: maintenance
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

exports.createMaintenance = catchAsync(async (req, res, next) => {
  let queryObj = "";

  if (req.file) {
    queryObj = { ...req.body, photo: req.file.filename };
  } else {
    queryObj = req.body;
  }

  const mrequest = await Maintenance.create(queryObj);

  /**We need to reference a maintenance to a user who created it */

  const tenant = await User.findByIdAndUpdate(
    req.body.id,
    { $push: { maintenances: mrequest._id } },
    { new: true }
  );

  res.status(201).json({
    status: "success",
    data: mrequest
  });
});

exports.updateMaintenance = async (req, res) => {
  try {
    const updatedmaintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { $set: { status: req.body.status } },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      data: updatedmaintenance
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "failed",
      data: err
    });
  }
};

exports.getAllMaintenances = async (req, res) => {
  try {
    const maintenances = await Maintenance.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      items: maintenances.length,
      data: maintenances
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "failed",
      data: err
    });
  }
};

exports.deleteMaintenance = async (req, res) => {
  try {
    const unit = await Maintenance.findOneAndDelete({
      _id: req.params.id
    });

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
};
