const db=require('../config/db')

const User={
    // get all users
    getAll:(callback)=>{
        const sql="select * from users order by id desc"
        db.query(sql,callback)
    },

    //  find user by id
    findByID:(id,callback)=>{
        const sql="select * from users where id=?"
        db.query(sql,[id], callback)
    },
    // find by email address
    findByEmail:(email,callback)=>{
        const sql= `select * from users where email=?`
        db.query(sql,[email], callback)
    },

    // create user 
    create:(user,callback)=>{
        const sql=`
            insert into users 
            (name,email,role,password)
            values(?,?,?,?)
        `
        const values=[
            user.name,
            user.email,
            user.role,
            user.password,
        ]

        db.query(sql,values,callback)
    },
    // update a user
    update:(id,user,callback)=>{
        const sql=`
        update users 
        set name=?, email=?, role=?
        where id=?
        `
        const values=[
            user.name,
            user.email,
            user.role,
            id
        ]
        db.query(sql,callback,values)
    },
    delete:(id,callback)=>{
        const sql="delete from users where id=?"

        db.query(sql,[id], callback)
    }

}

module.exports=User