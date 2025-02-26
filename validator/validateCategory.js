const validator = require("validator");

function validatorCategory(data) {
   let errors = {};

   if (validator.isEmpty(data.name || "")) {
      errors.name = " Tên không được để trống!";
   }
   return {
      errors,
      isValid: Object.keys(errors).length === 0
};
}
module.exports = validatorCategory;