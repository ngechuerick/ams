const Inquiry = require("../models/InquiresModel");

exports.createInquiry = async function (req, res) {
  try {
    const inquiry = await Inquiry.create(req.body);

    res.status(200).json({
      status: "success",
      data: {
        inquiry
      }
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "fail",
      message: "There was an error creating a inquiry"
    });
  }
};

exports.getInquiry = function () {};
exports.getAllInquiries = function () {};
exports.deleteInquiry = function () {};
exports.updateInquiry = function () {};
