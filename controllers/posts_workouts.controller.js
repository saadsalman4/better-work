const { sequelize, User, Posts_Workouts, Sections, workoutExercise, templateExercises } = require('../connect');
const jwt = require('jsonwebtoken');
const {postSchema, workoutSchema, templateSchema} = require('../utils/inputSchemas');
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
            data: {
                slug: post.slug,
                caption: post.title,
                media: post.media,
                price: post.price,
                user_slug: post.user_slug
            }
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

async function createWorkout (req, res){
    const { title, description, tag, exercises } = req.body;
    let transaction;
    try{
        if (!req.files || !req.files.length) {
            return res.status(400).json({
                code: 400,
                message: 'Image/video file upload is required',
                data: []
            });
          }
          const { error } = workoutSchema.validate(req.body);
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
        transaction = await sequelize.transaction();
        const newWorkout = await Posts_Workouts.create({
            type: PostType.WORKOUT,
            title,
            media: filePath,
            description,
            tag,
            price: req.body.price,
            user_slug: req.user.slug
        }, { transaction });

        for (const exercise of exercises) {
            await workoutExercise.create({
                name: exercise.name,
                details: exercise.details,
                posts_workouts_slug: newWorkout.slug,
            }, { transaction });
        }

        await transaction.commit();

        const protocol = req.protocol;
        const host = req.get('host');
        newWorkout.media=protocol + '://'+ host + '/' + newWorkout.media.split(path.sep).join('/')

        return res.status(201).json({
            code: 201,
            message: "Workout created successfully",
            data: {
                slug: newWorkout.slug,
                title: newWorkout.title,
                media: newWorkout.media,
                description: newWorkout.description,
                tag: newWorkout.tag,
                price: newWorkout.price,
                exercises,
                user_slug: newWorkout.user_slug
            }
        });

    }
    catch(e){
        if (transaction) await transaction.rollback();

        console.error(e);
        return res.status(500).json({
            code: 500,
            message: "Server error",
            data: e.message,
        });
    }
}

async function createTemplate (req, res){
    const { templateName, sections } = req.body;
    let transaction;

    try{
        const { error } = templateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                code: 400,
	            message: error.details[0].message,
                data: []
            })
        }
        transaction = await sequelize.transaction();

        const newTemplate = await Posts_Workouts.create({
            type: PostType.TEMPLATE,
            title: templateName,
            user_slug: req.user.slug
        }, { transaction });

        for (const sectionData of sections) {
            const { name, exercises } = sectionData;

            const newSection = await Sections.create({
                name,
                posts_workouts_slug: newTemplate.slug
            }, { transaction });

            for (const exerciseData of exercises) {
                await templateExercises.create({
                    name: exerciseData.name,
                    intensity: exerciseData.intensity,
                    standard_time: exerciseData.standard_time,
                    goal_time: exerciseData.goal_time,
                    notes: exerciseData.notes,
                    section_slug: newSection.slug
                }, { transaction });
            }
        }

        await transaction.commit();

        return res.status(201).json({
            code: 201,
            message: 'Template created successfully',
            data: {
                slug: newTemplate.slug,
                templateName: newTemplate.title,
                sections,
                user_slug: newTemplate.user_slug
            }
        });

    }
    catch(e){
        if (transaction) await transaction.rollback();
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: 'Server error',
            data: e.message
        });
    }
}

module.exports = {createPost, createWorkout, createTemplate }