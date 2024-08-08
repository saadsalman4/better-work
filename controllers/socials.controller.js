const { sequelize, Relationship, User } = require('../connect');
const path = require('path')


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

module.exports = {followUser, unfollowUser, getFollowers, getFollowing}