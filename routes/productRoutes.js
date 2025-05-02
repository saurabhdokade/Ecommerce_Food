const express = require("express");
const router = express.Router();
const  {createProduct,updateProduct,getAllProducts,getProductById} = require("../controllers/productController");
const upload = require("../utils/multerr"); 
const {isAuthenticatedUser} = require("../middlewares/auth"); 

//create product
router.post("/add", upload.array("image", 5),isAuthenticatedUser,createProduct);

// Update product
router.put(
    "/product/:id",
    isAuthenticatedUser,
    upload.array("images", 5),
    updateProduct
  );
  
  // Get all products
  router.get("/products", getAllProducts);
  
  // Get product by ID
  router.get("/product/:id", getProductById);
//get all products
// router.get("/",getAllProducts);
// //get product by id
// router.get("/:id",getProductById);
// //update product by id
// router.put("/:id", upload.array("image", 5),isAuthenticatedUser,updateProduct);
// //delete product by id
// router.delete("/:id", isAuthenticatedUser,deleteProduct);

module.exports = router;
