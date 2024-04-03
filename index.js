const PORT = process.env.PORT||8000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

app.use(express.json());
app.use(cors()); // Corrected: cors should be invoked as a function

// mongoose.connect("mongodb://127.0.0.1:27017/Ecom2");
const Product = mongoose.model("product", {
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  catgory: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

app.post("/addproduct", async (req, res) => {
  let products = await Product.find({});
  let id;
  if (products.length > 0) {
    let last_products = products.slice(-1);
    let last_product = last_products[0];
    console.log("Last product is ", last_products);
    id = last_product.id + 1;
  } else {
    id = 1;
  }
  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    catgory: req.body.catgory,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });
  console.log(product);
  await product.save();
  // console.log("saved");
  res.json({ success: true, name: req.body.name });
});
app.get("/", (req, res) => {
  res.send("running");
});
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});
const upload = multer({ storage: storage });
app.use("/images", express.static("./upload/images"));
app.post("/upload", upload.single("product"), (req, res) => {
  res.json({
    success: 1,
    image_url: `http://localhost:${PORT}/images/${req.file.filename}`,
  });
});
app.get("/displayall", async (req, res) => {
  let products = await Product.find({});
  // console.log("fetch")
  res.send(products);
});
app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("remove");
  res.json({ success: true, name: req.body.name });
});
//schema for login
const User = mongoose.model("Users", {
  name: {
    type: String,
    // required:true,
  },
  email: {
    type: String,
    unique: true,
    // required:true,
  },
  password: {
    type: String,
  },
  CartData: {
    type: Object,
    default: {},
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});
//api login
app.post("/signup", async (req, res) => {
  let check = await User.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({
      success: false,
      errors: "existing user found with same email",
    });
  }
  let cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }
  const user = new User({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    CartData: cart,
  });
  await user.save();
  const data = {
    user: {
      id: user.id,
    },
  };
  const token = jwt.sign(data, "secret_ecom");
  res.json({ success: true, token });
});
app.post("/login", async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (user) {
    const passCompare = req.body.password === user.password;
    if (passCompare) {
      const data = {
        user: {
          id: user.id,
        },
      };
      // console.log(user.id)
      const token = jwt.sign(data, "secret_ecom");
      res.json({ success: true, token });
    } else {
      res.json({
        success: false,
        errors: "wrong password",
      });
    }
  } else {
    res.json({
      success: false,
      errors: "Wrong Email Id",
    });
  }
});
app.get("/newcollection", async (req, res) => {
  let products = await Product.find({});
  let newcollection = products.slice(1).slice(-8);
  // console.log("fetch")
  res.send(newcollection);
});
app.get("/popularwomen", async (req, res) => {
  let products = await Product.find({ catgory: "women" });
  let popularwomen = products.slice(0, 4);
  res.send(popularwomen);
});

const fetchuser = async (req, res, next) => {
  const token = req.header("auth-token");
  // console.log(token)
  if (!token) {
    res.status(401).send({ errors: "please authenticate using valid token" });
  } else {
    try {
      const data = jwt.verify(token, "secret_ecom");
      req.user = data.user;
      next();
    } catch (error) {
      res.status(401).send({ errors: "Please Authenticate" });
    }
  }
};
app.post("/cart", fetchuser, async (req, res) => {
  let uData = await User.findOne({ _id: req.user.id });
  uData.CartData[req.body.itemId] += 1;
  await User.findOneAndUpdate(
    { _id: req.user.id },
    { CartData: uData.CartData }
  );
  res.send("Added");
});
app.post("/removeCart", fetchuser, async (req, res) => {
  let uData = await User.findOne({ _id: req.user.id });
  if (uData.CartData[req.body.itemId] > 0) {
    uData.CartData[req.body.itemId] -= 1;
    await User.findOneAndUpdate(
      { _id: req.user.id },
      { CartData: uData.CartData }
    );
    res.send("Added");
  }
});
app.post("/getCart", fetchuser, async (req, res) => {
  let uData = await User.findOne({ _id: req.user.id });
  res.send(uData.CartData);
});
app.get("/dev",(req.res)=>
{
  res.send("dev")
}
)

app.listen(PORT, (err) => {
  if (!err) {
    console.log(`Server is running on port ${PORT}`);
  } else {
    console.log("error" + err);
  }
});
