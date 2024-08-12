const { UserRole, OTPType, TokenType, PostType } = require('../utils/constants');
const { sequelize, User, Posts_Workouts, Relationship } = require('../connect');
const path = require('path')
const Sequelize = require('sequelize');
 


async function myPosts(req, res){
    try{
        const userSlug = req.user.slug;
        const posts = await Posts_Workouts.findAll({
            where: {
                user_slug: userSlug,
                type: PostType.POST
            },
            attributes: ['slug', 'title', 'media', 'type', 'price'],
        });

        const protocol = req.protocol;
        const host = req.get('host');

        const transformedPosts = posts.map(post => {
            return {
                slug: post.slug,
                caption: post.title,
                media: `${protocol}://${host}/${post.media.split(path.sep).join('/')}`,
                type: post.type,
                price: post.price,
            };
        });

        return res.status(200).json({
            code: 200,
            message: 'Posts retrieved successfully',
            data: transformedPosts,
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

async function myWorkouts(req, res){
    try{
        const userSlug = req.user.slug;
        const all = await Posts_Workouts.findAll({where:{user_slug: userSlug, type: PostType.WORKOUT},
            attributes: ['slug', 'title', 'media', 'price', 'type', 'tag']
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

async function myShares (req, res){
    try{
        const userSlug = req.user.slug;
        const sharedPosts = await Posts_Workouts.findAll({
            where: {
                user_slug: userSlug,
                type: PostType.SHARE,
            },
            include: [
                {
                    model: User,
                    as: 'user', // Alias for the User model association
                    attributes: ['slug', 'full_name', 'profileImage'], // Attributes from the User model
                },
                {
                    model: Posts_Workouts,
                    as: 'originalPost', // Alias for the self-association
                    include: {
                        model: User,
                        as: 'user', // Alias for the User model association
                        attributes: ['slug', 'full_name', 'profileImage'], // Attributes from the User model
                    },
                },
            ],
        });

        const protocol = req.protocol;
        const host = req.get('host');

        const sharedPostsData = sharedPosts.map(post => ({
            slug: post.slug,
            caption: post.sharer_caption,
            type: post.type,
            sharer: {
                slug: post.user.slug,
                name: post.user.full_name,
                profileImage: post.user.profileImage ? `${protocol}://${host}/${post.user.profileImage.split(path.sep).join('/')}` : null,
            },
            originalPost: {
                slug: post.originalPost.slug,
                caption: post.originalPost.title,
                media: post.originalPost.media ? `${protocol}://${host}/${post.originalPost.media.split(path.sep).join('/')}` : null,
                price: post.originalPost.price,
                poster: {
                    slug: post.originalPost.user.slug,
                    name: post.originalPost.user.full_name,
                    profileImage: post.originalPost.user.profileImage ? `${protocol}://${host}/${post.originalPost.user.profileImage.split(path.sep).join('/')}` : null,
                },
            },
        }));

        return res.status(200).json({
            code: 200,
            message: 'Shared posts retrieved successfully',
            data: sharedPostsData,
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

async function myFollowersCount(req, res){
    try{
        const userSlug = req.user.slug

        const followers = await Relationship.findAll({
            where: {
                followed_id: userSlug,
                is_deleted: false
            }
        });
        const followersCount = followers.length

        return res.status(200).json({
            code: 200,
            message: 'Follower count retrieved successfully',
            data : {
                followerCount: followersCount
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

async function myFollowingCount (req, res){
    try{
        const userSlug = req.user.slug

        const following = await Relationship.findAll({
            where: {
                follower_id: userSlug,
                is_deleted: false
            }
        });
        const followingCount = following.length

        return res.status(200).json({
            code: 200,
            message: 'Following count retrieved successfully',
            data : {
                followingCount: followingCount
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

async function myProfile(req, res) {
    try {
        const userId = req.user.slug;

        const userProfile = await User.findOne({
            where: { slug: userId },
            attributes: [
                'full_name', 
                'profileImage', 
                'email',
                [Sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM Relationships AS followers
                    WHERE followers.followed_id = User.slug
                    AND followers.is_deleted = false
                )`), 'numberOfFollowers'],
                [Sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM Relationships AS following
                    WHERE following.follower_id = User.slug
                    AND following.is_deleted = false
                )`), 'numberOfFollowing']
            ]
        });

        if (!userProfile) {
            return res.status(404).json({
                code: 404,
                message: "User not found",
                data: []
            });
        }

        const profileImageUrl = userProfile.profileImage 
            ? `${req.protocol}://${req.get('host')}/${userProfile.profileImage.split(path.sep).join('/')}` 
            : null;

        return res.status(200).json({
            code: 200,
            message: "User profile retrieved successfully",
            data: {
                full_name: userProfile.full_name,
                profileImage: profileImageUrl,
                email: userProfile.email,
                numberOfFollowers: userProfile.dataValues.numberOfFollowers,
                numberOfFollowing: userProfile.dataValues.numberOfFollowing,
            }
        });

    } catch (e) {
        console.log(e);
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: [],
        });
    }
}

async function viewUserProfile(req, res) {
    try {
        const userSlug = req.user.slug;
        const { profileUserSlug } = req.params;

        if(userSlug == profileUserSlug){
            return myProfile(req, res)
            
        }

        const userProfile = await User.findOne({
            where: { slug: profileUserSlug },
            attributes: {
                include: [
                    'full_name', 
                    'email',
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM Relationships AS followerCount
                            WHERE 
                                followerCount.followed_id = User.slug
                                AND followerCount.is_deleted = false
                        )`),
                        'numberOfFollowers'
                    ],
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM Relationships AS followingCount
                            WHERE 
                                followingCount.follower_id = User.slug
                                AND followingCount.is_deleted = false
                        )`),
                        'numberOfFollowing'
                    ],
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM Relationships AS checkFollow
                            WHERE 
                                checkFollow.follower_id = '${userSlug}'
                                AND checkFollow.followed_id = User.slug
                                AND checkFollow.is_deleted = false
                        )`),
                        'hasFollowed'
                    ],
                ]
            }
        });

        if (!userProfile) {
            return res.status(404).json({
                code: 404,
                message: "User not found",
                data: []
            });
        }

        const protocol = req.protocol;
        const host = req.get('host');
        const profileImageUrl = userProfile.profileImage 
            ? `${protocol}://${host}/${userProfile.profileImage.split(path.sep).join('/')}` 
            : null;

        return res.status(200).json({
            code: 200,
            message: "User profile retrieved successfully",
            data: {
                full_name: userProfile.full_name,
                email: userProfile.email,
                profileImage: profileImageUrl,
                numberOfFollowers: userProfile.dataValues.numberOfFollowers,
                numberOfFollowing: userProfile.dataValues.numberOfFollowing,
                hasFollowed: userProfile.dataValues.hasFollowed > 0 // Convert to boolean
            }
        });

    } catch (e) {
        console.log(e);
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: [],
        });
    }
}



module.exports = {myPosts, myWorkouts, myShares, myFollowersCount, myFollowingCount, myProfile, viewUserProfile}