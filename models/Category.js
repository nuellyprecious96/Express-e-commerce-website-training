const db = require("../config/db");

const Category = {

    // Create category
    create: (category, callback) => {

        const sql = `
            INSERT INTO categories (category)
            VALUES (?)
        `;

        const values = [category];

        db.query(sql, values, callback);
    },
    // get all category 
    getAll:(callback)=>{
        const sql=`select * from categories order by id desc`
        db.query(sql,callback)
    },
    // find category by id
    getById:(id,callback)=>{
        const sql=`select * from categories  where id=?`
        db.query(sql,[id],callback)
    }
};

module.exports = Category;