const { sequelize, Relationship, User, Likes, Posts_Workouts, Comment } = require('../connect');
const path = require('path');
const { PostType } = require('../utils/constants');
const { commentSchema } = require('../utils/inputSchemas');


async function followUser(req, res){
    try{
        const userSlug = req.user.slug;
        const { followSlug } = req.params;

        if(userSlug==followSlug){
            return res.status(400).json({
                code: 400,
                message: "Cannot follow itself",
                data: []
            })
        }
        const checkFollow = await Relationship.findOne({where: {follower_id: userSlug, followed_id: followSlug}})

        if(checkFollow){
            if(checkFollow.is_deleted==false){
            return res.status(400).json({
                code: 400,
                message: "Cannot refollow",
                data: []
            })
            }
            else if(checkFollow.is_deleted==true){
                checkFollow.is_deleted=false;
                await checkFollow.save()
                
                return res.status(200).json({
                    code: 200,
                    message: 'Successfully followed the user',
                });
            }
        }
        
        await Relationship.create({
            follower_id: userSlug,
            followed_id: followSlug,
        });

        return res.status(200).json({
            code: 200,
            message: 'Successfully followed the user',
        });

    }
    catch(e){
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: []
        });
    }
}

async function unfollowUser(req, res) {
    try {
        const userSlug = req.user.slug;
        const { unfollowSlug } = req.params;

        // Check if the user is trying to unfollow themselves
        if (userSlug === unfollowSlug) {
            return res.status(400).json({
                code: 400,
                message: "Cannot unfollow itself",
                data: []
            });
        }

        // Find the follow relationship
        const followRelation = await Relationship.findOne({
            where: { follower_id: userSlug, followed_id: unfollowSlug }
        });

        // Check if the relationship exists and is not already deleted
        if (followRelation) {
            if (followRelation.is_deleted === true) {
                return res.status(400).json({
                    code: 400,
                    message: "Cannot unfollow again",
                    data: []
                });
            } else {
                // Soft delete the relationship
                followRelation.is_deleted = true;
                await followRelation.save();

                return res.status(200).json({
                    code: 200,
                    message: 'Successfully unfollowed the user',
                });
            }
        } else {
            return res.status(400).json({
                code: 400,
                message: "Follow relationship does not exist",
                data: []
            });
        }

    } catch (e) {
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: []
        });
    }
}

async function getFollowers(req, res) {
    try {
        const userSlug = req.user.slug;

        const followers = await Relationship.findAll({
            where: {
                followed_id: userSlug,
                is_deleted: false
            },
            include: [
                {
                    model: User,
                    as: 'follower',
                    attributes: ['slug', 'full_name', 'profileImage']
                }
            ],
            attributes: ['slug']
        });

        const protocol = req.protocol;
        const host = req.get('host');

        const followersData = followers.map(follower => ({
            slug: follower.slug,
            follower: {
                slug: follower.follower.slug,
                name: follower.follower.full_name,
                profileImage: follower.follower.profileImage ? `${protocol}://${host}/${follower.follower.profileImage.split(path.sep).join('/')}` : null            }
        }));

        return res.status(200).json({
            code: 200,
            message: 'Followers retrieved successfully',
            data: followersData
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: 'Server error',
            data: error.message
        });
    }
}

async function getFollowing(req, res) {
    try {
        const userSlug = req.user.slug;

        const following = await Relationship.findAll({
            where: {
                follower_id: userSlug,
                is_deleted: false
            },
            include: [
                {
                    model: User,
                    as: 'followed',
                    attributes: ['slug', 'full_name', 'profileImage']
                }
            ],
            attributes: ['slug']
        });

        const protocol = req.protocol;
        const host = req.get('host');

        const followingData = following.map(follow => ({
            slug: follow.slug,
            followed: {
                slug: follow.followed.slug,
                name: follow.followed.full_name,
                profileImage: follow.followed.profileImage ? `${protocol}://${host}/${follow.followed.profileImage.split(path.sep).join('/')}` : null
            }
        }));

        return res.status(200).json({
            code: 200,
            message: 'Following list retrieved successfully',
            data: followingData
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: 'Server error',
            data: error.message
        });
    }
}

async function likePost(req, res){
    try{
        const userSlug = req.user.slug;
        const { postSlug } = req.params;

        const existingLike = await Likes.findOne({
            where: { user_slug: userSlug, post_slug: postSlug, is_deleted: false }
        });

        if(existingLike){
            return res.status(400).json({
                code: 400,
                message: "Already liked this post",
                data: []
            });
        }

        const post = await Posts_Workouts.findOne({
            where:{
                slug: postSlug,
                type: PostType.POST
            }
        })

        if(!post){
            return res.status(404).json({
                code: 404,
                message: "Post not found!",
                data: []
            })
        }

        await Likes.create({
            user_slug: userSlug,
            post_slug: postSlug
        });

        return res.status(200).json({
            code: 200,
            message: "Post liked successfully",
            data: []
        });

    }
    catch(e){
        console.log(e);
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: []
        });

    }
}

async function removeLike(req, res){
    try{
        const userSlug = req.user.slug;
        const { postSlug } = req.params;

        const like = await Likes.findOne({
            where: { user_slug: userSlug, post_slug: postSlug, is_deleted: false }
        });

        if (!like) {
            return res.status(400).json({
                code: 400,
                message: "Like not found",
                data: []
            });
        }

        await like.update({ is_deleted: true });

        return res.status(200).json({
            code: 200,
            message: "Like removed successfully",
            data: []
        });


    }
    catch(e){
        console.log(e);
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: []
        });
    }
}

async function addComment(req, res){
    try {

        const { error } = commentSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                code: 400,
                message: error.details[0].message,
                data: []
            });
        }

        const userId = req.user.slug;
        const { postSlug, commentText } = req.body;

        // Check if the post exists
        const post = await Posts_Workouts.findOne({
            where: { slug: postSlug }, type: PostType.POST
        });

        if (!post) {
            return res.status(404).json({
                code: 404,
                message: "Post not found",
                data: []
            });
        }

        // Create the comment
        const newComment = await Comment.create({
            post_slug: postSlug,
            user_slug: userId,
            comment_text: commentText,
            is_deleted: false, // Default value, can be omitted
        });

        return res.status(201).json({
            code: 201,
            message: "Comment posted successfully",
            data: {
                slug: newComment.slug,
                post_slug: newComment.post_slug,
                user_slug: newComment.user_slug,
                comment_text: newComment.comment_text,
                createdAt: newComment.createdAt,
            }
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: [],
        });
    }
}

async function updateComment(req, res) {
    const transaction = await sequelize.transaction(); // Start a transaction

    try {
        const userId = req.user.slug;
        const { commentSlug, newCommentText } = req.body;

        // Find the original comment
        const originalComment = await Comment.findOne({
            where: {
                slug: commentSlug,
                user_slug: userId,
                is_deleted: false
            },
            transaction
        });

        if (!originalComment) {
            await transaction.rollback(); // Rollback transaction
            return res.status(404).json({
                code: 404,
                message: "Comment not found",
                data: []
            });
        }

        // Mark the original comment as deleted
        originalComment.is_deleted = true;
        await originalComment.save({ transaction });

        // Create a new comment entry with the updated text
        const updatedComment = await Comment.create({
            post_slug: originalComment.post_slug,
            user_slug: userId,
            comment_text: newCommentText,
            is_deleted: false,
        }, { transaction });

        await transaction.commit(); // Commit the transaction

        return res.status(201).json({
            code: 201,
            message: "Comment updated successfully",
            data: {
                slug: updatedComment.slug,
                post_slug: updatedComment.post_slug,
                user_slug: updatedComment.user_slug,
                comment_text: updatedComment.comment_text,
                createdAt: updatedComment.createdAt,
            }
        });

    } catch (e) {
        await transaction.rollback(); // Rollback the transaction in case of error
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: [],
        });
    }
}

async function deleteComment(req, res) {
    try {
        const userId = req.user.slug;
        const { commentSlug } = req.body;

        // Find the comment to be deleted
        const comment = await Comment.findOne({
            where: {
                slug: commentSlug,
                user_slug: userId,
                is_deleted: false
            }
        });

        if (!comment) {
            return res.status(404).json({
                code: 404,
                message: "Comment not found or already deleted",
                data: []
            });
        }

        // Soft delete the comment by setting is_deleted to true
        comment.is_deleted = true;
        await comment.save();

        return res.status(200).json({
            code: 200,
            message: "Comment deleted successfully",
            data: {
                slug: comment.slug,
                post_slug: comment.post_slug,
                user_slug: comment.user_slug,
                comment_text: comment.comment_text,
                is_deleted: comment.is_deleted,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            }
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: [],
        });
    }
}

module.exports = {followUser, unfollowUser, getFollowers, getFollowing, likePost, removeLike,
    addComment, updateComment, deleteComment
}