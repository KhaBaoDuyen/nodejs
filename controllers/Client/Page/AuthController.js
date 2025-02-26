const ProductModel = require('../../../models/ProductModel');
const userModel = require('../../../models/UserModel');
const validatorUser = require("../../../validator/validatorUser");
const sanitizeInput = require("../../../validator/sanitize");

const fs = require("fs");
const path = require("path");
const { Sequelize } = require('sequelize');

class AuthController {

   static async get(req, res) {
      try {
         res.status(200).render('Client/Page/Auth/login', {
            layout: "Client/layout",
            title: "Đăng nhập/ Đăng ký"
         });
      } catch (error) {
         res.status(500).json({ error: error.message });
      }
   }


   static async getById(req, res) {
      try {
         const { id } = req.params;
         const user = await userModel.findByPk(id);

         if (!user) {
            return res.status(404).json({ message: "Id không tồn tại" });
         }

         res.status(200).json({
            "status": 200,
            "data": user
         });
      } catch (error) {
         res.status(500).json({ error: error.message });
      }
   }


   static async create(req, res) {
      try {
         console.log("Request Body:", req.body); // Kiểm tra dữ liệu từ form
         let userInput = sanitizeInput(req.body);
         console.log("Sanitized Input:", userInput); // Kiểm tra dữ liệu sau khi sanitize

         const { name, email, password } = req.body;
         let { errors, isValid } = validatorUser(userInput);
         console.log("Validation Errors:", errors); // Kiểm tra lỗi validation

         // if (!isValid) {
         //    return res.render("Client/Page/Auth/login", { 
         //       title: "Đăng ký", 
         //       errors,
         //       name,
         //       email,
         //       password
         //    });
         // }
         if (!isValid) {
            return res.json({
               status: 200,
               message: "Them thanh cong",
               body: req.body
            })
         }

         const user = await userModel.create({ name, email, password });
         res.status(201).json({
            message: "Thêm mới thành công",
            user
         });
      } catch (error) {
         console.error("Error:", error); // Kiểm tra lỗi server
         res.status(500).json({ error: error.message });
      }
   }

   static async update(req, res) {
      try {
         const { id } = req.params;
         let userInput = sanitizeInput(req.body);
         const {
            name,
            email,
            password
         } = req.body;
         let { errors, isValid } = validatorUser(userInput);

         if (!isValid) {
            return res.status(400).json({ message: " Du lieu khong hop le!", errors });
         }
         const user = await userModel.findByPk(id);
         if (!user) {
            return res.status(404).json({ message: "Id không tồn tại" });
         }

         user.name = name;
         user.email = email;
         user.password = password;
         await user.save();

         res.status(200).json({
            message: "Cập nhật thành công",
            user
         });
      } catch (error) {
         res.status(500).json({ error: error.message });
      }
   }

}
module.exports = AuthController;