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
    const { title, description, tags, exercises } = req.body;
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
            tag: tags.join(','),
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
                tags,
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
    const { title, description, tags, exercises } = req.body;
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
            tag: tags.join(','),
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
                tags,
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

async function postView(req, res){
    const { slug } = req.params;

    try {
        const post = await Posts_Workouts.findOne({
            where: { slug, type: PostType.POST },
            attributes: ['slug', 'title', 'media', 'price', 'createdAt'],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['slug', 'full_name', 'email', 'profileImage'],
                },
            ],
        });

        // Check if post exists
        if (!post) {
            return res.status(404).json({
                code: 404,
                message: 'Post not found',
                data: [],
            });
        }

        // Process media URL
        const protocol = req.protocol;
        const host = req.get('host');
        post.media = protocol + '://' + host + '/' + post.media.split(path.sep).join('/');

        // Include user profile image URL processing
        if (post.user.profileImage) {
            post.user.profileImage = protocol + '://' + host + '/' + post.user.profileImage.split(path.sep).join('/');
        }

        return res.status(200).json({
            code: 200,
            message: 'Post retrieved successfully',
            data: {
                slug: post.slug,
                title: post.title,
                media: post.media,
                price: post.price,
                createdAt: post.createdAt,
                user: {
                    slug: post.user.slug,
                    full_name: post.user.full_name,
                    email: post.user.email,
                    profileImage: post.user.profileImage,
                },
            },
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: 'Server error',
            data: e.message,
        });
    }
}

async function workoutView(req, res){
    const {slug} = req.params;
    try{
        const workout = await Posts_Workouts.findOne({
            where: { slug, type: PostType.WORKOUT },
            attributes: ['slug', 'title', 'media', 'description', 'tag', 'price'],
            include: [
                {
                    model: workoutExercise,
                    as: 'workouts',
                    attributes: ['name', 'details'],
                },
            ],
        });

        if(!workout){
            return res.status(404).json({
                code: 404,
                message: 'Workout not found',
                data: [],
            });
        }

        const protocol = req.protocol;
        const host = req.get('host');
        workout.media = protocol + '://' + host + '/' + workout.media.split(path.sep).join('/');

        // Split tags into an array if they are stored as a comma-separated string
        const tagsArray = workout.tag ? workout.tag.split(',') : [];

        return res.status(200).json({
            code: 200,
            message: 'Workout retrieved successfully',
            data: {
                slug: workout.slug,
                title: workout.title,
                media: workout.media,
                description: workout.description,
                tag: tagsArray,
                price: workout.price,
                exercises: workout.workouts, // List of exercises
            },
        });

    }
    catch(e){
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: 'Server error',
            data: e.message,
        });
    }
}

async function templateView(req, res) {
    const { slug } = req.params;

    try {
        const template = await Posts_Workouts.findOne({
            where: { slug, type: PostType.TEMPLATE },
            attributes: ['slug', 'title', 'createdAt'],
            include: [
                {
                    model: Sections,
                    as: 'sections',
                    attributes: ['slug', 'name'],
                    include: [
                        {
                            model: templateExercises,
                            as: 'exercises',
                            attributes: ['name', 'intensity', 'standard_time', 'goal_time', 'notes'],
                        },
                    ],
                },
            ],
        });

        if (!template) {
            return res.status(404).json({
                code: 404,
                message: 'Template not found',
                data: [],
            });
        }

        const templateData = {
            slug: template.slug,
            templateName: template.title,
            createdAt: template.createdAt,
            sections: template.sections.map(section => ({
                slug: section.slug,
                name: section.name,
                exercises: section.exercises.map(exercise => ({
                    name: exercise.name,
                    intensity: exercise.intensity,
                    standard_time: exercise.standard_time,
                    goal_time: exercise.goal_time,
                    notes: exercise.notes,
                })),
            })),
        };

        return res.status(200).json({
            code: 200,
            message: 'Template retrieved successfully',
            data: templateData,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: 'Server error',
            data: e.message,
        });
    }
}

async function deletePost(req, res) {
    const { slug } = req.params;
    const currentUserSlug = req.user.slug;

    try {
        // Find the post by slug
        const post = await Posts_Workouts.findOne({ where: { slug, type: PostType.POST } });

        // Check if post exists
        if (!post) {
            return res.status(404).json({
                code: 404,
                message: 'Post not found',
                data: [],
            });
        }

        // Check if the current user is the owner of the post
        if (post.user_slug !== currentUserSlug) {
            return res.status(403).json({
                code: 403,
                message: 'Unauthorized to delete this post',
                data: [],
            });
        }

        // Delete the post
        await post.destroy();

        return res.status(200).json({
            code: 200,
            message: 'Post deleted successfully',
            data: [],
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: 'Server error',
            data: e.message,
        });
    }
}

async function deleteWorkout(req, res) {
    const { slug } = req.params;
    const currentUserSlug = req.user.slug;

    try {
        // Find the workout by slug
        const workout = await Posts_Workouts.findOne({ where: { slug, type: PostType.WORKOUT } });

        // Check if workout exists
        if (!workout) {
            return res.status(404).json({
                code: 404,
                message: 'Workout not found',
                data: [],
            });
        }

        // Check if the current user is the owner of the workout
        if (workout.user_slug !== currentUserSlug) {
            return res.status(403).json({
                code: 403,
                message: 'Unauthorized to delete this workout',
                data: [],
            });
        }

        // Delete the workout
        await workout.destroy();

        return res.status(200).json({
            code: 200,
            message: 'Workout deleted successfully',
            data: [],
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: 'Server error',
            data: e.message,
        });
    }
}

async function deleteTemplate(req, res) {
    const { slug } = req.params;
    const currentUserSlug = req.user.slug;

    try {
        // Find the template by slug
        const template = await Posts_Workouts.findOne({ where: { slug, type: PostType.TEMPLATE } });

        // Check if template exists
        if (!template) {
            return res.status(404).json({
                code: 404,
                message: 'Template not found',
                data: [],
            });
        }

        // Check if the current user is the owner of the template
        if (template.user_slug !== currentUserSlug) {
            return res.status(403).json({
                code: 403,
                message: 'Unauthorized to delete this template',
                data: [],
            });
        }

        // Delete associated sections
        await Sections.destroy({ where: { posts_workouts_slug: slug } });

        // Delete the template
        await template.destroy();

        return res.status(200).json({
            code: 200,
            message: 'Template deleted successfully',
            data: [],
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: 'Server error',
            data: e.message,
        });
    }
}

async function sharePost(req, res){
    try{
        const { originalPostSlug } = req.params; // Original post's slug
        const { sharerCaption } = req.body; // Caption added by the sharer
        const sharerUserSlug = req.user.slug; // Slug of the user sharing the post

        const originalPost = await Posts_Workouts.findOne({
            where: { slug: originalPostSlug, type: PostType.POST }
        });

        if (!originalPost) {
            return res.status(404).json({
                code: 404,
                message: 'Original post not found.',
                data: [],
            });
        }

        if(originalPost.user_slug == sharerUserSlug){
            return res.status(400).json({
                code: 400,
                message: "Cannot share own post",

                data: []
            })
        }

        const sharedPost = await Posts_Workouts.create({
            type: PostType.SHARE,
            title: originalPost.title, // New title or original title
            media: originalPost.media, // Keep the same media
            price: originalPost.price,
            user_slug: sharerUserSlug, // Slug of the sharer
            shared_from: originalPost.slug, // Slug of the original post
            sharer_caption: sharerCaption || null

        });

        const protocol = req.protocol;
        const host = req.get('host');
        sharedPost.media=protocol + '://'+ host + '/' + sharedPost.media.split(path.sep).join('/')

        return res.status(201).json({
            code: 201,
            message: 'Post shared successfully',
            data: sharedPost,
        });

    }
    catch(e){
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: [],
        });
    }
}


module.exports = {createPost, createWorkout, createTemplate, updatePost, updateWorkout, updateTemplate,
    viewAll, viewPosts, viewWorkouts, viewTemplates, workoutView, postView, templateView, deletePost,
    deleteWorkout, deleteTemplate, sharePost
 }