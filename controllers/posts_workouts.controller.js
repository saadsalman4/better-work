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

async function updatePost(req, res) {
    try {
        const postSlug = req.params.slug;
        const { caption, price } = req.body;
        
        const { error } = postSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                code: 400,
                message: error.details[0].message,
                data: []
            });
        }
        
        const post = await Posts_Workouts.findOne({
            where: { slug: postSlug, type: PostType.POST }
        });

        if (!post) {
            return res.status(404).json({
                code: 404,
                message: 'Post not found',
                data: []
            });
        }

        if (post.user_slug !== req.user.slug) {
            return res.status(403).json({
                code: 403,
                message: 'You are not authorized to update this post',
                data: []
            });
        }

        // If there's a new file to upload, handle it
        let filePath = post.media; // Preserve old media path if no new file is provided
        if (req.files && req.files.length > 0) {
            const uploadedFile = req.files[0];
            const fileName = Date.now() + '_' + uploadedFile.originalname;
            filePath = path.join('public', fileName);

            fs.writeFile(filePath, uploadedFile.buffer, (err) => {
                if (err) {
                    console.error('Error saving file:', err);
                    return res.status(500).json({
                        code: 500,
                        message: 'An error occurred while saving the file',
                        data: []
                    });
                }
            });
        }

        // Update post data
        await post.update({
            title: caption || post.title,
            price: price || post.price,
            media: filePath
        });

        const protocol = req.protocol;
        const host = req.get('host');
        post.media = protocol + '://' + host + '/' + post.media.split(path.sep).join('/');

        return res.status(200).json({
            code: 200,
            message: 'Post updated successfully',
            data: {
                slug: post.slug,
                caption: post.title,
                media: post.media,
                price: post.price,
                user_slug: post.user_slug
            }
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: []
        });
    }
}

async function updateWorkout(req, res) {
    const { title, description, tag, exercises } = req.body;
    const workoutSlug = req.params.slug;
    let transaction;

    try {
        const { error } = workoutSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                code: 400,
                message: error.details[0].message,
                data: []
            });
        }

        const workout = await Posts_Workouts.findOne({
            where: { slug: workoutSlug, type: PostType.WORKOUT }
        });

        if (!workout) {
            return res.status(404).json({
                code: 404,
                message: 'Workout not found',
                data: []
            });
        }

        if (workout.user_slug !== req.user.slug) {
            return res.status(403).json({
                code: 403,
                message: 'You are not authorized to update this workout',
                data: []
            });
        }

        let filePath = workout.media; // Preserve old media path if no new file is provided
        if (req.files && req.files.length > 0) {
            const uploadedFile = req.files[0];
            const fileName = Date.now() + '_' + uploadedFile.originalname;
            filePath = path.join('public', fileName);

            fs.writeFile(filePath, uploadedFile.buffer, (err) => {
                if (err) {
                    console.error('Error saving file:', err);
                    return res.status(500).json({
                        code: 500,
                        message: 'An error occurred while saving the file',
                        data: []
                    });
                }
            });
        }

        transaction = await sequelize.transaction();

        await workout.update({
            title: title || workout.title,
            description: description || workout.description,
            tag: tag || workout.tag,
            price: req.body.price || workout.price,
            media: filePath
        }, { transaction });

        await workoutExercise.destroy({
            where: { posts_workouts_slug: workoutSlug },
            transaction
        });

        for (const exercise of exercises) {
            await workoutExercise.create({
                name: exercise.name,
                details: exercise.details,
                posts_workouts_slug: workoutSlug
            }, { transaction });
        }

        await transaction.commit();

        const protocol = req.protocol;
        const host = req.get('host');
        workout.media = protocol + '://' + host + '/' + workout.media.split(path.sep).join('/');

        return res.status(200).json({
            code: 200,
            message: 'Workout updated successfully',
            data: {
                slug: workout.slug,
                title: workout.title,
                media: workout.media,
                description: workout.description,
                tag: workout.tag,
                price: workout.price,
                exercises,
                user_slug: workout.user_slug
            }
        });
    } catch (e) {
        if (transaction) await transaction.rollback();

        console.error(e);
        return res.status(500).json({
            code: 500,
            message: 'Server error',
            data: e.message
        });
    }
}

async function updateTemplate(req, res) {
    const { templateName, sections } = req.body;
    const templateSlug = req.params.slug;
    let transaction;

    try {
        const { error } = templateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                code: 400,
                message: error.details[0].message,
                data: []
            });
        }

        const template = await Posts_Workouts.findOne({
            where: { slug: templateSlug, type: PostType.TEMPLATE }
        });

        if (!template) {
            return res.status(404).json({
                code: 404,
                message: 'Template not found',
                data: []
            });
        }

        if (template.user_slug !== req.user.slug) {
            return res.status(403).json({
                code: 403,
                message: 'You are not authorized to update this template',
                data: []
            });
        }

        // Start transaction
        transaction = await sequelize.transaction();

        await template.update({
            title: templateName || template.title
        }, { transaction });

        // Delete all existing sections for the template
        await Sections.destroy({
            where: { posts_workouts_slug: templateSlug },
            transaction
        });

        // Create new sections and their exercises
        for (const sectionData of sections) {
            const { name, exercises } = sectionData;

            const newSection = await Sections.create({
                name,
                posts_workouts_slug: templateSlug
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

        // Commit transaction
        await transaction.commit();

        return res.status(200).json({
            code: 200,
            message: 'Template updated successfully',
            data: {
                slug: template.slug,
                templateName: template.title,
                sections,
                user_slug: template.user_slug
            }
        });
    } catch (e) {
        if (transaction) await transaction.rollback();

        console.error(e);
        return res.status(500).json({
            code: 500,
            message: 'Server error',
            data: e.message
        });
    }
}

async function viewAll(req, res) {
    try {
        // Fetch all posts, templates, and workouts
        const all = await Posts_Workouts.findAll({
            attributes: ['slug', 'title', 'media', 'price', 'type', 'description']
        });

        // Get the protocol and host for constructing the full URL
        const protocol = req.protocol;
        const host = req.get('host');

        // Map over the results to prepend the full URL to the media field
        const allWithFullMediaUrls = all.map(item => {
            const mediaUrl = item.media ? protocol + '://' + host + '/' + item.media.split(path.sep).join('/') : null;
            return {
                ...item.toJSON(),
                media: mediaUrl
            };
        });

        return res.status(200).json({
            code: 200,
            message: "All items retrieved successfully",
            data: allWithFullMediaUrls
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: []
        });
    }
}

async function viewPosts(req, res){
    try{
        const all = await Posts_Workouts.findAll({where:{type: PostType.POST},
            attributes: ['slug', 'title', 'media', 'price', 'type']
        })

        const protocol = req.protocol;
        const host = req.get('host');

        // Map over the results to prepend the full URL to the media field
        const allWithFullMediaUrls = all.map(item => {
            const mediaUrl = item.media ? protocol + '://' + host + '/' + item.media.split(path.sep).join('/') : null;
            return {
                ...item.toJSON(),
                media: mediaUrl
            };
        });

        return res.status(200).json({
            code: 200,
            message: "All posts retrieved successfully",
            data: allWithFullMediaUrls
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

async function viewWorkouts(req, res){
    try{
        const all = await Posts_Workouts.findAll({where:{type: PostType.WORKOUT},
            attributes: ['slug', 'title', 'media', 'price', 'type']
        })

        const protocol = req.protocol;
        const host = req.get('host');

        // Map over the results to prepend the full URL to the media field
        const allWithFullMediaUrls = all.map(item => {
            const mediaUrl = item.media ? protocol + '://' + host + '/' + item.media.split(path.sep).join('/') : null;
            return {
                ...item.toJSON(),
                media: mediaUrl
            };
        });

        return res.status(200).json({
            code: 200,
            message: "All workouts retrieved successfully",
            data: allWithFullMediaUrls
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

async function viewTemplates(req, res){
    try{
        const all = await Posts_Workouts.findAll({where:{type: PostType.TEMPLATE},
            attributes: ['slug', 'title', 'price', 'type', 'description']
        })

        return res.status(200).json({
            code: 200,
            message: "All templates retrieved successfully",
            data: all
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
module.exports = {createPost, createWorkout, createTemplate, updatePost, updateWorkout, updateTemplate,
    viewAll, viewPosts, viewWorkouts, viewTemplates
 }