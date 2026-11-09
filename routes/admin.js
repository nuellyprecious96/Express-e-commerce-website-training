const express=require("express")
const router=express.Router()
const User=require('../models/User')


// admin middleware 
const { isAdmin } = require('../middleware/auth');

// user middleware 
const { isUser } = require('../middleware/auth');

router.get('/member',isUser,(req,res)=>{
     res.render('admin/users',{
        title:"Members",
        user: req.session.user,
        layout:false
     })
})

router.get('/admin',isAdmin,(req,res)=>{
  User.getAll((err,users)=>{
   if(err){
      console.error(err)
      return res.status(500).send("database error")
   }
// total users
   const totalUsers=users.length;
   
   // for total admin 
   const totalAdmin=users.filter(item =>item.role==="admin")
   .length
   // for regular user
   const totalRegular=users.filter(item =>item.role==="user")
   .length
   res.render('admin/dashboard',{
      title:"Admin Dashboard",
      totalUsers,
      totalAdmin,
      totalRegular,
      layout:false,
      user: req.session.user,
      users
   })

  })
})



module.exports=router