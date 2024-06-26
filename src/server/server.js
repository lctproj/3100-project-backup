import {createRequire} from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
import {jwtDecode} from 'jwt-decode';

app.use(cors());
app.use(express.json());

const PORT = 3001 ; 
//3001

const mongoose = require('mongoose');
const uri = 'mongodb+srv://Shop_com:iD5HFvC4Ly9YKb2j@shop-comdb.rn4suxq.mongodb.net/Shop_com';
const secretKey = 'shopdotcom'
//
mongoose.connect(uri).then(() => {
    console.log('MongoDB Connected…')
}).catch(err => console.log(err));

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
  console.log("Connection is open...");

  const ItemSchema = new mongoose.Schema({
    item_id:{
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    vendor:{
        type:String,
        required:true
    },
    price:{
        type: Number,
        required: true
    },
    stock_quantity:{
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: [String],
        required: true
    },
    url:{
        type: [String]
    },
    curated: {
        type: Boolean,
        default: false
    },    
    comments:[{
        username: {
            type: String,
            required: [true, "Username is required"],
        },
        comment: {
            type: String,
            required: [true, "Comment is required"],
        },
        rating:{
            type: Number,
            required: [true, "Rating is required"],
        }
    }],
    rating:{
        type:Number,
        required:true
    },
    rating_count:{
      type:Number,
      required:true
  }
});

    const Item =  mongoose.model("Item",ItemSchema);

    const UserSchema = new mongoose.Schema({
        user_id:{
            type: String,
            required: true,
            unique: true
        },
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        email: {
            type: String,
            unique: true,
        },
        shopping_cart:[
            {
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Item',
                    required: true
                },
                purchased: {
                    type: Number,
                    required: true,
                    min: 1
                }
            }
        ]
    });

    const User = mongoose.model("User", UserSchema);

    const AdminSchema = new mongoose.Schema({
        admin_id:{
            type: Number,
            required: true,
            unique: true
        },
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        }
    })

   
    const Admin = mongoose.model("Admin", AdminSchema);
    
    // =================================================================
    app.post('/signup', async (req, res) => {
        const {username, password, email} = req.body;
        const new_password = await bcrypt.hash(password,10);
        try{
            const maxUser  = await User.findOne().sort({ user_id: -1 }).exec();
            const user_id = maxUser ? Number(maxUser.user_id) + 1 : 1;

            const new_user = new User({user_id:user_id,username: username, password: new_password, email:email});
            new_user.save().then(() => {
                res.status(200).json({message:"success"});
            }).catch(err => {
                res.status(404).json({message:err});
            });      
        }catch(e){
            res.status(404).json({message:"failed"});
        }
    })

    app.post('/login', async (req, res) => {
        const { usernameOrEmail, password } = req.body;
    
        try {
            const matching_user = await User.findOne({ $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }] });
    
            if (matching_user) {
                const compare_password = await bcrypt.compare(password, matching_user.password);
                if (compare_password) {
                    const token = jwt.sign(
                        {
                            id: matching_user.user_id,
                            user_type: "user",
                            username: matching_user.username
                        },
                        secretKey,
                        { expiresIn: '12h' }
                    );
                    return res.status(200).json({ message: "success", token: token, user_type: "user" });
                } else {
                    return res.status(401).json({ message: "Incorrect user password" });
                }
            } else {
                const matching_admin = await Admin.findOne({ username: usernameOrEmail });
                if (!matching_admin) {
                    return res.status(404).json({ message: "User and admin not found" });
                }
    
                const compare_password = await bcrypt.compare(password, matching_admin.password);
                if (compare_password) {
                    const token = jwt.sign(
                        {
                            id: matching_admin.user_id,
                            user_type: "admin",
                            username: matching_admin.username
                        },
                        secretKey,
                        { expiresIn: '12h' }
                    );
                    return res.status(200).json({ message: "success", token: token, user_type: "admin" });
                } else {
                    return res.status(401).json({ message: "Incorrect admin password" });
                }
            }
        } catch (e) {
            console.error(e);
            return res.status(500).json({ message: "An internal error occurred" });
        }
    });

    app.post('/add-to-cart',async (req, res) => {
        const {user_id, purchased, item_id} = req.body;
        try{
            const item = await Item.findOne({item_id: item_id});
            if(!item) {
                return res.status(404).json({ "message": "Item not Found" });
            }

            if(item.stock_quantity < purchased) {
                return res.status(400).json({ "message": "Purchased quantity exceeded stock quantity" });
            }
            const user = await User.findOne({user_id: user_id}).populate('shopping_cart.item');

            if(!user) {
                return res.status(404).json({ "message": "User not found" });
            }
            
            let existing_item = user.shopping_cart.find((item) => item.item.item_id === item_id);
            if(existing_item){
                existing_item.purchased = purchased;
                await user.save();
                return res.status(200).json({ "message": "Purchased quantity updated successfully" });

            }else{
                const data = {
                    item: item._id,
                    purchased: purchased
                }

                user.shopping_cart.push(data);
                await user.save();

                await item.save(); 
                return  res.status(200).json({ "message": "Item added successfully" });
               
            }
        }catch(err) {
            console.error(err); 
            return res.status(500).json({message: "An error occurred"});
        }
    })

    app.get('/all-items',async (req, res)=>{
        try{
            const items = await Item.find({});
            res.status(200).json(items);
        }catch(err){
            res.status(500).send('Failed fetching items');
        }
    });

    app.post('/all-cart-items', async (req, res) => {
        const {user_id} = req.body;
        try{
            //find user
            const user = await User.findOne({"user_id" : user_id}).populate('shopping_cart.item');


            if (!user) {
                res.status(404).send('User not found');
                return;
            }

            //extract user cart
            const user_cart = user.shopping_cart;

            if (!user_cart) {
                res.status(404).send('Unable to fetch user\'s cart');
                return;
            }
 
            //calculate total price
            const total = user_cart.reduce((sum, item) =>   sum + 100 * parseFloat(item.item.price) * parseInt(item.purchased, 10), 0)/100;
            
            //if both user and cart found, send results to client-side
            if(user_cart && user){
                res.status(200).json({
                    items: user_cart,
                    total: total,
                });
            }else{
                res.status(404).send('Error retrieving cart');
            }
        }catch(err){
            res.status(500).send(err,'Error fetching user\'s cart');
        }

    });


    //Quantity +1 handler
    app.post('/quantity-plus-one', async (req,res)=>{
        const {user_id, item_id} = req.body;
        try{
            //find user
        const user = await User.findOne({user_id : user_id}).populate('shopping_cart.item');

        //Unable to find user
        if(!user){
            res.status(404).send('Failed fetching user');
        }

        //locate item position in cart
        const target_item_index = user.shopping_cart.findIndex((item) => item.item.item_id.toString() === item_id);

        const target_item = user.shopping_cart[target_item_index];

        //If item found
        if (target_item_index !== -1) {
            const stock_quantity = target_item.item.stock_quantity;

            //if stock > requested amount
            if(stock_quantity > target_item.purchased){
                target_item.purchased += 1;
                await user.save(); 
                
                //recalcuate subtotal
                const subtotal = (100  * target_item.item.price) * target_item.purchased / 100;
                const user_cart = user.shopping_cart; 

                if (!user_cart) {
                    res.status(404).send('Unable to fetch user\'s cart');
                    return;
                }
     
                //recalculate total
                const total = user_cart.reduce((sum, item) =>   sum + (100 * parseFloat(item.item.price) )* parseInt(item.purchased, 10), 0)/ 100;

                //updated calculations, send it back to client-side
                const updated_result = {
                    purchased: target_item.purchased,
                    subtotal: subtotal,
                    total:total
                }

                res.status(200).json(updated_result);
            }else{
                //if stock low on supply
                res.status(400).json({"message":`Item ${item_id} purchased quantity exceeded stock quantity`});
            }
        } else {
            //if item not found
            res.status(404).send('Item not found in shopping cart');
        }
        }catch(err){
            console.log(err);
            res.status(500).send('Failed updating quantity on shopping cart')
        }
    });

    //Quantity -1 handler
    app.post('/quantity-minus-one', async (req,res)=>{
        const {user_id, item_id} = req.body;
        try{
            const user = await User.findOne({user_id : user_id}).populate('shopping_cart.item');

            if(!user){
                res.status(404).send('Failed fetching user');
            }

            const target_item_index = user.shopping_cart.findIndex((item) => item.item.item_id.toString() == item_id);
            
            const target_item = user.shopping_cart[target_item_index];
            
            if (target_item_index !== -1) {
                     
                        target_item.purchased -= 1;
                        await user.save();   
                                  
                        const subtotal = (100  * target_item.item.price) * target_item.purchased / 100;
                        const user_cart = user.shopping_cart;

                        if (!user_cart) {
                            res.status(404).send('Unable to fetch user\'s cart');
                            return;
                        }
            
                        const total = user_cart.reduce((sum, item) =>   sum + 100 * parseFloat(item.item.price) * parseInt(item.purchased, 10), 0) / 100;

                        const updated_result = {
                            purchased: target_item.purchased,
                            subtotal: subtotal,
                            total: total
                        }
        
                        res.status(200).json(updated_result);
                    
                 
            } else {
                res.status(404).send('Item not found in shopping cart');
            }
        }catch(err){
            console.log(err);
            res.status(500).send('Failed updating quantity on shopping cart')
        }
    });

    //delete item handler
    app.delete('/delete-item', async (req,res)=>{
        const {user_id, item_id} = req.body;
        try{
            //find user
        const user = await User.findOne({user_id : user_id}).populate('shopping_cart.item');
       

        if(!user){
            res.status(404).send('Failed fetching user');
        }

        //locate item in cart
        const target_item_index = user.shopping_cart.findIndex((item) => item.item.item_id.toString() === item_id);

        if (target_item_index !== -1) {
            // removes item from shopping cart array
            user.shopping_cart.splice(target_item_index,1); 
            await user.save();
            const user_cart = user.shopping_cart;

            if (!user_cart) {
                res.status(404).send('Unable to fetch user\'s cart');
                return;
            }
            //recalculate total
            const total = user_cart.reduce((sum, item) =>   sum + 100 * parseFloat(item.item.price) * parseInt(item.purchased, 10), 0)/100;
             
            res.status(202).json({"total":total});
        }else {
            res.status(404).send('Item not found in shopping cart');
        }
    }catch(err){
            console.log(err);
            res.status(500).send(`Failed deleting item ${item_id} from shopping cart`)
        }

    });

    // ===Admin Functions:==============================================================

    app.get('/all-users', async (req, res) => {
      try {
          const users = await User.find({});
          res.status(200).json(users);
      } catch (err) {
          console.error(err); 
          res.status(500).send('Admin Functions: Failed fetching users.');
      }
    });

    app.get('/all-products', async (req, res) => {
      try {
          const items = await Item.find({});
          res.status(200).json(items);
      } catch (err) {
          console.error(err); 
          res.status(500).send('Admin Functions: Failed fetching items.');
      }
    });


    app.post('/add-user', async (req, res) => {
    const newUser = new User(req.body);
    try {
        await newUser.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(500).send('Admin Functions: Failed to add user.');
    }
    });

    app.put('/edit-user/:id', async (req, res) => {
      try {
          const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
          res.status(200).json(updatedUser);
      } catch (err) {
          res.status(500).send('Admin Functions: Failed to edit user.');
      }
    });

    app.delete('/delete-user/:id', async (req, res) => {
        try {
            await User.findByIdAndDelete(req.params.id);
            res.status(200).send('User deleted');
        } catch (err) {
            res.status(500).send('Admin Functions: Failed to delete user');
        }
    });

    
    app.post('/add-product', async (req, res) => {
        const newItem = new Item(req.body);
        try {
            await newItem.save();
            res.status(201).json(newItem);
        } catch (err) {
            console.error(err);
            res.status(500).send('Admin Functions: Failed to add product.');
        }
    });


    app.put('/edit-product/:id', async (req, res) => {
        try {
            const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.status(200).json(updatedItem);
        } catch (err) {
            console.error(err);
            res.status(500).send('Admin Functions: Failed to edit product.');
        }
    });


    app.delete('/delete-product/:id', async (req, res) => {
        try {
            await Item.findByIdAndDelete(req.params.id);
            res.status(200).send('Product deleted');
        } catch (err) {
            console.error(err);
            res.status(500).send('Admin Functions: Failed to delete product.');
        }
    });

    // ===Product functions=====================================================
    app.get('/product/:id', async (req, res) => {
      try {
        const item = await Item.find({ item_id: req.params.id });
        res.status(200).json(item);
      } catch (err) {
        console.error(err);
        res.status(500).send('Product Functions: Failed to find product with the specified id.');
      }
    })

    app.get('/category/:category', async (req, res) => {
      try {
        const item = await Item.find({ category: req.params.category });
        res.status(200).json(item);
      } catch (err) {
        console.error(err);
        res.status(500).send(`Product Functions: Failed to find products with the specified category ${req.params.category}.`);
      }
    })

    app.get('/search' , async (req, res) => {
      try {
        const item = await Item.find({ $text: { $search: req.query.q, $caseSensitive: false } });
        res.status(200).json(item);
      } catch (err) {
        console.error(err);
        res.status(500).send(`Product Functions: Failed to search products with the specified query ${req.query.q}.`);
      }
    })
});


app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});