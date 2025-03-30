const mongoose = require("mongoose");

const inquirySchema = mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now()
  },
  name: {
    type: String
  },
  description: {
    type: String
  },
  email: {
    type: String
  },
  phone: {
    type: String
  }
});

const Inquiry = mongoose.model("Inquiry", inquirySchema);

module.exports = Inquiry;
