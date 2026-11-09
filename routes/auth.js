const express=require('express')
const bcrypt=require('bcryptjs')
const User=require('../models/User')
const isAdmin=require

// respAPI //
const router=express.Router()

router.get('/register',(req,res)=>{
    res.render('home')
})

router.post('/register',async(req,res)=>{
    try{
        const{
            name,email,role,password,confirmPassword
        }=req.body
        if(!name||!email||!role||!password||!confirmPassword){
            return res.status(400).json({
                success:false,
                message:"All fields are required "
            })
        }
//  password lenght
        if(password.length<6 && password.length<=8){
            return res.status(400).json({
                success:false,
                message:"password must be atleats 6 or 8  characters"
            })
        }
//  password lenght must not be more 8
        // if(password.length<=8){
        //     return res.status(400).json({
        //         success:false,
        //         message:"password has exceed the range"
        //     })
        // }

// check if email already exists 
User.findByEmail(email, async(err,results)=>{

    if(err){
        console.log(err)
        return res.status(500).json({
            success:false,
            message:"database error"
        })
    }
    if(results.length >0){
        return res.status(400).json({
            success:false,
            message:"Email Already exists"
        })
    }

    // hash password 
    const hashpassword=await bcrypt.hash(password,10)
    // insert user
    const user={
        name,
        email,
        role,
        password:hashpassword
    }
    User.create(user,(err,results)=>{
            if(err){
                console.error(err)

                return res.status(500).json({
                    success:false,
                    message:"failed to create user"
                })
            }
            res.redirect('/')
    })

})
    }catch(error){
        console.error(error)
        res.status(500).json({
            success:false,
            message:"server error"
        })

    }
})

router.get('/login',(req,res)=>{
   res.render('home')
})

router.post('/login', (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    User.findByEmail(email, async (err, users) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (!users || users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        try {

            const passwordMatch = await bcrypt.compare(
                password,
                user.password
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Regenerate session after successful login
            req.session.regenerate((err) => {

                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        success: false,
                        message: 'Session creation failed'
                    });
                }

                // Store logged-in user information
                req.session.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                };

                // Redirect based on user role
                if (user.role === 'admin') {
                    return res.redirect('/admin');
                }

                if (user.role === 'user') {
                    return res.redirect('/member');
                }

                req.session.destroy(() => {
                    return res.status(403).json({
                        success: false,
                        message: 'Invalid user role'
                    });
                });

            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: 'Login failed'
            });

        }

    });

});

router.get('/logout', (req, res) => {

    req.session.destroy((err) => {

        if (err) {
            return res.status(500).send('Unable to logout');
        }

        res.clearCookie('ecommerce_session');

        res.redirect('/');
    });

});
module.exports=router