const CategoryModel = require("../../models/CategoryModel");

class CategoryController {
   static async get(req, res) {
      try {
         const categories = await CategoryModel.findAll();
         res.status(200).render("Admin/page/Categories/category", {
            // status: 200,
            // message: "Thành công",
            // data: categories
            layout: "Admin/layout",
            title: "Quản lý danh mục",
            category: categories,
         });
      } catch (error) {
         res.status(500).json({ error: error.message });
      }
   }

   // ------------------------[ CREATE ]---------------------------
   static async createFrom(req, res) {
      res.render("Admin/page/Categories/Create", {
         layout: "Admin/layout",
         title: "Thêm mới danh mục"
      });
   }

   static async create(req, res) {
      try {
         const { name,
            status
         } = req.body;

         const image = req.file ? req.file.filename : null;

         const category = await CategoryModel.create({
            name,
            image,
            status
         });

         req.flash("success", "Danh mục thêm thành công!");
         return res.redirect("/admin/category/list");

      } catch (error) {
         console.error("Lỗi:", error.message);
         res.status(500).json({ error: error.message });
      }
   }

   // ------------------------[ UPDATE ]---------------------------
   static async updateFrom(req, res) {
      try {
         const categoryId = req.params.id;
         const category = await CategoryModel.findByPk(categoryId);

         if (!category) {
            return res.status(404).json({ error: "Danh mục không tồn tại" });
         }

         res.render("Admin/page/Categories/Edit", {
            layout: "Admin/layout",
            title: "Cập nhật danh mục",
            calog: category
         });
      } catch (error) {
         console.error("Lỗi:", error.message);
         res.status(500).json({ error: error.message });
      }
   }

   static async update(req, res) {
      try {
         const categoryId = req.params.id;
         const { name, status, image_old } = req.body;

         const category = await CategoryModel.findByPk(categoryId);

         if (!category) {
            return res.status(404).json({ error: "Danh mục không tồn tại" });
         }

         const image = req.file ? req.file.filename : image_old;

         await category.update({
            name,
            image,
            status
         });

         req.flash("success", "Cập nhật danh mục thành công!");
         return res.redirect("/admin/category/list");

      } catch (error) {
         console.error("Lỗi:", error.message);
         res.status(500).json({ error: error.message });
      }
   }

   // ------------------------[ DELETE ]---------------------------
   static async delete(req, res) {
      try {
         const {
            id
         } = req.params
         const category = await CategoryModel.findByPk(id);

         if (!category) {
            return res.status(404).json({ error: "Danh mục không tồn tại" });
         }
         await category.destroy();

         req.flash("success", "Xóa danh mục thành công!");
         return res.status(200).redirect("/admin/category/list");
      } catch (error) {
         req.flash("error", "Xóa danh mục thất bại!");
         return res.status(500).redirect("/admin/category/list");
      }
   }


}
module.exports = CategoryController;
