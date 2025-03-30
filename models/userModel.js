const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Unit = require("./unitModel");

const validator = require("validator");

/**Creating user Schema */
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "A user must contain firstName"]
  },
  lastName: {
    type: String
  },
  email: {
    type: String,
    required: [true, "A user must have a valid email!"],
    lowercase: true,
    unique: true,
    validate: [validator.isEmail, "Please provide a valid email!"]
  },
  password: {
    type: String,
    default: "testuser1234"
    // required: [true, "A user must contain a password"],
    // minLength: [
    //   5,
    //   "Password should not be less than ({MINLENGTH}) characters.",
    // ],
    // select: false,
  },
  passwordConfirm: {
    type: String,
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message:
        "Password mismatch. Ensure your password is the same with password confirm!"
    },
    select: false
  },
  phoneNumber: {
    type: String,
    required: [true, "A tenant must have a phone number!"],
    unique: true,
    validate: {
      validator: function (v) {
        return /^\+?[0-9]{1,4}?[-.\s]?\(?[0-9]{1,3}?\)?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}$/.test(
          v
        );
      },
      message: (props) => `${props.value}: is not a valid number!`
    }
  },
  role: {
    type: String,
    default: "user",
    enum: ["manager", "admin", "tenant", "caretaker", "user"]
  },
  active: {
    type: Boolean,
    default: true
  },
  photo: {
    type: String
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpiresIn: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  paidRent: {
    type: Boolean,
    default: false
  },

  /**Referencing a unit to a tenant */
  unit: {
    type: mongoose.Schema.ObjectId,
    ref: "Unit"
  },
  payments: [{ type: mongoose.Schema.ObjectId, ref: "Transaction" }],
  maintenances: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Maintenance"
    }
  ]
});

/**TODO FIXME WE SHALL NEED A FUNCTION TO RESET ALL TENANTS PAID RENT STATUS IF HE/SHE HAS NOT PAID THAT MONTH'S RENT. IF A TENANT HAS PAID EXTRA,YOU NEED TO DISPLAY NEXT DUE DATE FOR PAYMENT */

// Create a compound unique index on both username and email

/**MIDDLEWARE
 * DOCUMENT MIDDLEWARE
 * QUERY MIDDLEWARE
 * MODEL MIDDLEWARE
 * AGGREGATE MIDDLEWARE
 */

/**Instance methods to all douments created here */
userSchema.methods.checkCorrectPassword = async function (
  inputPassword,
  userSavedPassword
) {
  return await bcrypt.compare(inputPassword, userSavedPassword);
};

/**we need to encrypt user's password in the database as soon as a new user is created or updated */
userSchema.pre("save", async function (next) {
  this.password = await bcrypt.hash(this.password, 12);

  /**Since we do not want password confirm to persist in the database we set it to undefined */
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(["find", "findOne"], function (next) {
  if (this.getOptions().populateRelations !== false) {
    this.populate([
      { path: "unit", model: "Unit", select: "-__v" },
      { path: "maintenances", model: "Maintenance", select: "-__v" }
    ]);
  }

  next();
});

/**When we update  TENANT details we need to assign him/her vacant unit */
userSchema.pre("findOneAndUpdate", async function (next) {
  /**The items being updated */
  const update = this.getUpdate();
  const userId = this._conditions._id.$eq;
  const unitId = update?.$set?.unit;

  if (!unitId) return next();

  await Unit.updateOne(
    { _id: unitId },
    { $set: { tenant: userId, vacant: false } }
  );

  next();
});

userSchema.methods.createPasswordResetToken = function () {
  /**We shall be generating random 6 digits which will be send to clients email but encrypted on the DB */
  const randomToken = crypto.randomInt(100000, 999999).toString();
  const hashedToken = crypto
    .createHash("sha256")
    .update(randomToken)
    .digest("hex");

  /**Store the hashed token in the DB */
  this.passwordResetToken = hashedToken;

  /**The reset token should be set to expire after six mins */
  this.passwordResetExpiresIn = Date.now() + 6 * 60 * 1000;

  /**Return the randomtoken inorder for it to be sent to the user */
  return randomToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;

/**
 * TODO
 * LATER
 * FIXME
 */
