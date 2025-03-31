const mongoose = require("mongoose");
const User = require("./userModel");

const transactionSchema = mongoose.Schema({
  paymentMethod: {
    type: String,
    default: "Mpesa"
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  amountPaid: {
    type: Number
  },
  mpesatransactionCode: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  tenant: {
    type: mongoose.Schema.ObjectId,
    ref: "User"
  },
  totalAmountPaid: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["success", "failed"],
    required: true
  },
  checkoutRequestID: {
    type: String
  },
  errorMessage: {
    type: String
  }
});

/**Static method which calculates total monthly rent */
transactionSchema.statics.calcTotalMonthRent = async function () {
  const stats = await this.aggregate([
    {
      $addFields: {
        datePaid: { $toDate: "$createdAt" }
      }
    },
    {
      $group: {
        _id: { $month: "$datePaid" },
        totalRentCollected: { $sum: "$amountPaid" }
      }
    },
    {
      $sort: { _id: 1 }
    },
    {
      $project: {
        _id: 0,
        month: "$_id",
        totalRentCollected: 1
      }
    }
  ]);

  return stats;
};

/**Static method which calculates total amount of rent paid in a year */
transactionSchema.statics.calcTotalYearlyRent = async function () {
  const stats = await this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
        }
      }
    },
    {
      $group: {
        _id: null,
        totalRentCollected: { $sum: "$amountPaid" }
      }
    }
  ]);

  return stats;
};

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
