const ProductModel = require('../../../models/ProductModel');
const CategoryModel = require('../../../models/CategoryModel');


const fs = require("fs");
const path = require("path");
const { Sequelize } = require('sequelize');

class ProductController {


//-------------------------[ PRODUCT ]-------------------------

   static async get(req, res) {
      try {
         let page = parseInt(req.query.page) || 1;
         let limit = 10;
         let offset = (page - 1) * limit;

         const { count, rows: products } = await ProductModel.findAndCountAll({
            include: [{
               model: CategoryModel,
               as: 'category',
               attributes: ['id', 'name']
            }],
            limit: limit,
            offset: offset,
            order: [['id', 'DESC']]
         });

         const categories = await CategoryModel.findAll({
            attributes: [
               'id',
               'name',
               [Sequelize.fn('COUNT', Sequelize.col('products.id')), 'productsCount']
            ],
            include: [{
               model: ProductModel,
               as: 'products',
               attributes: []
            }],
            group: ['Category.id'],
            raw: true
         });

         const productsWithImages = products.map(product => ({
            ...product.toJSON(),
            images: Array.isArray(product.images) ? product.images : []
         }));

         let totalPages = Math.ceil(count / limit);

         res.render("Client/Page/Product/product", {
            layout: "Client/layout",
            title: "Sản phẩm",
            products: productsWithImages,
            categories: categories,
            currentPage: page,
            totalPages: totalPages
         });

      } catch (error) {
         console.error("Lỗi truy vấn sản phẩm:", error);
         res.status(500).json({ error: "Lỗi khi lấy danh sách sản phẩm!" });
      }
   }

   static async getProductDetail(req, res) {
      try {
         const { id } = req.params;
         const productDetail = await ProductModel.findByPk(id, {
            include: {
               model: CategoryModel,
               as: "category"
            }
         });

         if (!productDetail) {
            return res.status(404).json({ error: "Sản phẩm không tồn tại" });
         }

         productDetail.images = Array.isArray(productDetail.images) ? productDetail.images : [];

         return res.status(200).render("Client/Page/Product/productDetail", {
            title: "Chi tiết sản phẩm",
            productDetail,
            categoryName: productDetail.category ? productDetail.category.name : "Không có danh mục",
         });
      } catch (error) {
         console.error("Lỗi khi lấy sản phẩm:", error);
         res.status(500).json({ error: error.message });
      }
   }

   //-------------------------[ CREATE ]-------------------------
   static async createForm(req, res) {
      try {
         const category = await CategoryModel.findAll();

         res.render("Admin/page/Products/Create", {
            layout: "Admin/layout",
            title: "Tạo sản phẩm",
            category: category
         });
      } catch (error) {
         res.status(500).json({
            error: error.message
         });
      }
   }


   static async create(req, res) {
      try {
         const {
            name,
            price,
            category_id,
            discount_price,
            weight,
            description,
            short_description,
            status
         } = req.body;


         let images = [];
         if (req.files && req.files.length > 0) {
            images = req.files.map(file => file.filename);
         } else {
            throw new Error("Vui lòng chọn ít nhất một ảnh!");
         }

         const product = await ProductModel.create({
            name,
            price,
            category_id,
            discount_price: discount_price,
            weight: weight,
            description: description || "",
            short_description: short_description || "",
            status: status || 1,
            images
         });

         req.flash("success", "Sản phẩm thêm thành công!");
         return res.redirect("/admin/product/list");

      } catch (error) {
         console.error("Lỗi:", error.message);
         res.status(500).json({ error: error.message });
      }
   }

   //-------------------------[ UPDATE ]-------------------------
   // static async getById(req, res) {
   //    try {
   //       const {
   //          id
   //       } = req.params;
   //       const product = await ProductModel.findByPk(id);

   //       if (!product) {
   //          return res.status(404).json({
   //             message: "Id không tồn tại"
   //          });
   //       }

   //       res.status(200).json({
   //          "status": 200,
   //          "data": product
   //       });
   //    } catch (error) {
   //       res.status(500).json({
   //          error: error.message
   //       });
   //    }
   // }
   static async editForm(req, res) {
      try {
         const productDetail = await ProductModel.findByPk(req.params.id, {
            include: [{
               model: CategoryModel,
               as: "category",
               attributes: ["name"]
            }],
         });

         if (!productDetail) {
            return res.status(404).json({
               error: "Sản phẩm không tồn tại",
            });
         }

         const categoryList = await CategoryModel.findAll({
            attributes: ["id", "name"],
         });

         productDetail.images = Array.isArray(productDetail.images) ? productDetail.images : [];

         res.status(200).render("Admin/page/Products/Edit", {
            title: "Sửa sản phẩm",
            productDetail,
            categoryList,
            categoryName: productDetail.category ? productDetail.category.name : "Không có danh mục",
         });

      } catch (error) {
         console.error(" Lỗi khi lấy sản phẩm:", error);
         res.status(500).json({
            error: error.message,
         });
      }
   }



   static async edit(req, res) {
      try {
         const {
            name,
            price,
            category_id,
            discount_price,
            weight,
            description,
            short_description,
            status,
            image_old
         } = req.body;

         const product = await ProductModel.findByPk(req.params.id);
         if (!product) {
            req.flash("error", "Sản phẩm không tồn tại!");
            return res.status(404).redirect("/admin/product/list");
         }

         // Lấy danh sách ảnh cũ từ CSDL 
         let images = Array.isArray(product.images) ? product.images : [];

         let images_old = Array.isArray(image_old) ? image_old : images;

         // Nếu có ảnh mới được tải lên thì thêm vào danh sách ảnh
         if (req.files && req.files.length > 0) {
            const imagesNew = req.files.map(file => file.filename);
            images_old = [...images_old, ...imagesNew];
         }

         await ProductModel.update(
            {
               name,
               price,
               category_id,
               discount_price,
               weight,
               description,
               short_description,
               status,
               images: images_old
            },
            {
               where: { id: req.params.id }
            }
         );

         req.flash("success", "Sản phẩm cập nhật thành công!");
         return res.redirect("/admin/product/list");

      } catch (error) {
         console.error(" Lỗi cập nhật sản phẩm:", error);
         req.flash("error", "Có lỗi xảy ra khi cập nhật sản phẩm!");
         return res.redirect("/admin/product/list");
      }
   }

   // --------------------[ DELETE ]-----------------------------
   static async delete(req, res) {
      try {
         const {
            id
         } = req.params;

         const product = await ProductModel.findByPk(id);

         if (!product) {
            return res.status(404).json({
               message: "Không tìm thấy product"
            });
         }
         await product.destroy();

         // res.status(200).json({
         //    message: "Xóa thành công",
         //    product
         // });       
         req.flash("success", "Xóa sản phẩm thành công!");
         return res.status(200).redirect("/admin/product/list");
      } catch (error) {
         req.flash("error", "Xóa sản phẩm thất bại!");
         return res.status(500).redirect("/admin/product/list");
      }
   }




   static async deleteImage(req, res) {
      try {
         const { id } = req.params;
         const { image } = req.body;

         const product = await ProductModel.findByPk(id);
         if (!product) {
            req.flash("error", "Sản phẩm không tồn tại!");
            return res.redirect("back");
         }

         let images = Array.isArray(product.images) ? product.images : [];

         const updatedImages = images.filter(img => img !== image);

         await ProductModel.update({ images: updatedImages }, { where: { id } });

         const imagePath = path.join(__dirname, "../public/assets/uploads/products", image);
         if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
         }

         req.flash("success", "Xóa ảnh thành công!");
         return res.redirect("back");

      } catch (error) {
         console.error(" Lỗi xóa ảnh:", error);
         req.flash("error", "Có lỗi xảy ra khi xóa ảnh!");
         return res.redirect("back");
      }
   }

}
module.exports = ProductController;