const express = require("express");
const {Role} = require('../connect')

const router = express.Router();

router.post('/add-role', async (req, res)=>{
    const {role} = req.body
    try{
        const addingRole = await Role.create({
            role:role
        })
        return res.status(200).json(addingRole)
    }
    catch(e){
        console.log(e)
        return res.status(500).json("error")
    }
})

module.exports = router;