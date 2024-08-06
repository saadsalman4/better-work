const { UserRole, OTPType, TokenType, PostType } = require('../utils/constants');
const { sequelize, User, Posts_Workouts } = require('../connect');
const path = require('path')


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

module.exports = {myPosts, myWorkouts, myShares}