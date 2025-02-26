require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const multer = require('multer');
const methodOverride = require('method-override');
const session = require("express-session");
const flash = require('express-flash');
app.use(methodOverride('_method'));

const storageProduct = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, "public/assets/uploads/Products");
   },
   filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
   }
});
const storageCategory = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, "public/assets/uploads/Categories");
   },
   filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
   }
});
const storageUser = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, "public/assets/uploads/Users");
   },
   filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
   }
});
const fileImage = (req, file, cb) => {
   const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
   if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
   } else {
      cb(new Error("Chỉ cho phép định dạng JPG, JPEG, PNG"), false);
   }
};
const uploadProduct = multer({
   storage: storageProduct,
   fileFilter: fileImage,
   limits: { fileSize: 5 * 1024 * 1024 }
});
const uploadCategory = multer({
   storage: storageCategory,
   fileFilter: fileImage,
   limits: { fileSize: 5 * 1024 * 1024 }
});
const uploadUser = multer({
   storage: storageUser,
   fileFilter: fileImage,
   limits: { fileSize: 5 * 1024 * 1024 }
});
module.exports = { uploadProduct, uploadCategory, uploadUser };

const productsRoutes = require('./routes/Admin/ProductRoutes');
const categoryRoutes = require("./routes/Admin/CategoryRoutes");
const userRoutes = require("./routes/Admin/UserRoutes");
const orderRoutes = require("./routes/Admin/OrderRoutes");

//-------------------[ CLIENT ]------------------------
const indexRoutes = require("./routes/Client/indexRoutes")
const productRouter = require("./routes/Client/Page/productRouter");
const authRouter = require("./routes/Client/Page/AuthRouter");

// Middleware

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
   secret: process.env.SESSION_SECRET,
   resave: false,
   saveUninitialized: true
}));
app.use(flash());
app.use((req, res, next) => {
   res.locals.success = req.flash("success");
   res.locals.error = req.flash("error");
   next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);

// Cấu hình view 
app.set("views", path.join(__dirname, "View"));
app.set("view engine", "ejs");


const port = 3030;


// ----------------- Middleware ------------------
app.set("layout", "Admin/layout");
app.use((req, res, next) => {
   res.locals.layout = req.url.startsWith("/admin") ? "Admin/layout" : "Client/layout";
   next();
});

// ------------ models -------------------
require('./models/Associations');

// Định nghĩa routes
app.use('/', productsRoutes);
app.use("/", categoryRoutes);
app.use('/', userRoutes);
app.use('/', orderRoutes);

//--------------[ CLIENT ]-------------------
app.use("/", indexRoutes);
app.use("/", productRouter);
app.use("/", authRouter);



app.locals.formatCurrency = (value) => {
   return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'vnd'
   }).format(value);
};


// ================ [ CLIENT ] =====================


// ----------------- PRODUCT BY CATEGORY----------------
app.get('/productByCalog/:idCategory', (req, res) => {
   let cateId = req.params.idCategory;

   let sqlProductByCate = `SELECT * FROM products WHERE category_id = ${cateId}`;

   let sqlCategory = `
      SELECT c.id AS categoryId, c.name AS categoryName, 
         (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status =1) AS productCount
      FROM categories c
   `;

   connection.query(sqlProductByCate, function (err, productData) {
      if (err) throw err;

      connection.query(sqlCategory, function (err, categoryData) {
         if (err) throw err;

         res.render('Product/product', {
            title: 'Product Detail Page',
            products: productData,
            categories: categoryData
         });
      });
   });
});



// ----------------- USERS ----------------
app.get('/login', (req, res) => {
   res.render('Auth/login', {
      title: 'Đăng nhập/ Đăng ký',
      layout: false
   });
});

app.get('/recover_password', (req, res) => {
   res.render('Auth/recover_password', {
      title: 'Lấy lại mật khẩu',
      layout: false
   });
});

app.get('/profile', (req, res) => {
   res.render('Auth/profile', {
      title: 'Thông tin tài khoản'
   });
});


// ----------------- CART ----------------

app.get('/cart', (req, res) => {
   res.render('Cart/cart', {
      title: 'Giỏ hàng'
   });
});

app.get('/checkout', (req, res) => {
   res.render('Cart/checkout', {
      title: 'Giỏ hàng'
   });
});

app.get('/thank', (req, res) => {
   res.render('Cart/thank', {
      title: 'Cảm ơn'
   });
});



//-----------------------[ QUẢN LÝ ĐƠN HÀNG ] -------------------------

app.get('/admin/order', (req, res) => {
   // Lấy giá trị status 
   const status = req.query.status;
   // Lọc theo status 
   const ordersByUsers = listOrders.filter(order => {
      if (status) {
         return order.status === parseInt(status);
      }
      return true;  // Nếu không có  status, lấy tất cả đơn hàng
   }).map(order => {
      const user = listUsers.find(u => u.id === order.user_id);
      return {
         ...order,
         userName: user ? user.name : 'Không tìm thấy '
      };
   });

   res.render('Order/order', {
      title: 'Quản lý đơn hàng',
      orders: ordersByUsers,
   });
});


app.get('/admin/editOrder/:id', (req, res) => {
   let id = parseInt(req.params.id);

   // Tìm đơn hàng theo ID
   let orders = listOrders.find(item => item.id === id);
   if (!orders) {
      return res.status(404).send('Không tìm thấy đơn hàng');
   }

   // Tìm thông tin người dùng
   let users = listUsers.find(u => u.id === orders.user_id);
   let uName = users ? users.name : 'Không xác định';

   let sql = `
      SELECT p.name, d.quantity, d.price
      FROM detailorder d
      JOIN products p ON d.product_id = p.id
      WHERE d.order_id = ?
   `;

   connection.query(sql, [id], (err, products) => {
      if (err) {
         console.error('Lỗi truy vấn sản phẩm:', err);
         return res.status(500).send('Lỗi server');
      }
      res.render('Order/Edit', {
         title: 'Sửa đơn hàng',
         orders: orders,
         uName: uName,
         products: products
      });
   });
});

app.use(productsRoutes);

app.listen(port, () => {
   console.log(`http://localhost:${port}`);
});
