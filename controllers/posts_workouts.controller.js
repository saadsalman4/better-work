const { sequelize, User, Posts_Workouts, Sections, Exercises } = require('../connect');
const jwt = require('jsonwebtoken');
const {postSchema} = require('../utils/inputSchemas');
const { PostType } = require('../utils/constants');
const path = require ('path')
const fs = require('fs')


async function createPost(req, res){
    try{
        if (!req.files || !req.files.length) {
            return res.status(400).json({
                code: 400,
                message: 'Image/video file upload is required',
                data: []
            });
          }
        const { error } = postSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                code: 400,
	            message: error.details[0].message,
                data: []
            })
        }
        const uploadedFile = req.files[0];
        const fileName = Date.now() + '_' + uploadedFile.originalname;
        
        const filePath = path.join('public', fileName);
        
        fs.writeFile(filePath, uploadedFile.buffer, async (err) => {
          if (err) {
            console.error('Error saving file:', err);
            return res.status(500).json({
                code: 500,
                message: 'An error occurred while saving the file',
                data: []
            });
          }
        })
        
        if(!req.body.price){
            req.body.price = 0
        }

        const post = await Posts_Workouts.create({
            type: PostType.POST,
            title: req.body.caption,
            price: req.body.price,
            media:filePath,
            user_slug: req.user.slug
        });

        const protocol = req.protocol;
        const host = req.get('host');
        post.media=protocol + '://'+ host + '/' + post.media.split(path.sep).join('/')

        return res.status(200).json({
            code: 200,
            message: "Post created successfully",
            data: post
        })
    }
    catch(e){
        console.log(e)
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: []
        })

    }

}


module.exports = {createPost}