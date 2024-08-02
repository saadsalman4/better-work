const { Op } = require('sequelize')
const {WorkoutSession} = require('../connect')


async function checkIn(req, res) {
    const { slug } = req.user; // Extract user slug from authenticated user
    const user_slug = slug

    try {
        // Check if there's an ongoing session for this user
        const ongoingSession = await WorkoutSession.findOne({
            where: {
                user_slug,
                check_out: null, // Look for sessions where check_out is null
            },
            order: [['createdAt', 'DESC']], // Order by the most recent session
        });

        if (ongoingSession) {
            return res.status(400).json({
                code: 400,
                message: 'You are already checked in. Please check out before checking in again.',
                data: []
            });
        }

        // Create a new workout session
        const newSession = await WorkoutSession.create({
            user_slug,
            check_in: new Date(),
        });

        return res.status(200).json({
            code: 200,
            message: 'Checked in successfully',
            data: {
                slug: newSession.slug,
                check_in: newSession.check_in,
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: 'Server error',
            data: error.message,
        });
    }
}

async function checkOut(req, res) {
    const { slug } = req.user;
    const user_slug = slug;

    try {
        // Find the ongoing session for this user
        const ongoingSession = await WorkoutSession.findOne({
            where: {
                user_slug,
                check_out: null, // Look for sessions where check_out is null
            },
            order: [['createdAt', 'DESC']], // Order by the most recent session
        });

        if (!ongoingSession) {
            return res.status(400).json({
                code: 400,
                message: "No ongoing session found to check out.",
                data: [],
            });
        }

        // Set the check_out time to the current time
        ongoingSession.check_out = new Date();

        // Save the changes
        await ongoingSession.save();

        return res.status(200).json({
            code: 200,
            message: "Successfully checked out.",
            data: {
                slug: ongoingSession.slug,
                check_in: ongoingSession.check_in,
                check_out: ongoingSession.check_out,
                duration: ongoingSession.duration,
                user_slug: ongoingSession.user_slug,
            },
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

async function getCurrentSessionDuration(req, res) {
    const { slug } = req.user; // Extract user slug from authenticated user
    const user_slug = slug

    try {
        // Find the ongoing session for this user
        const ongoingSession = await WorkoutSession.findOne({
            where: {
                user_slug,
                check_out: null, // Look for sessions where check_out is null
            },
            order: [['createdAt', 'DESC']], // Order by the most recent session
        });

        if (!ongoingSession) {
            return res.status(400).json({
                code: 400,
                message: "No ongoing session found.",
                data: [],
            });
        }

        // Calculate the current duration
        const currentDuration =
            (new Date() - new Date(ongoingSession.check_in)) / (1000 * 60 * 60); // Convert milliseconds to hours

        return res.status(200).json({
            code: 200,
            message: "Current session duration retrieved successfully.",
            data: {
                slug: ongoingSession.slug,
                check_in: ongoingSession.check_in,
                duration: currentDuration.toFixed(2), // Limit to 2 decimal places for readability
                user_slug: ongoingSession.user_slug,
            },
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

async function getTotalDuration(req, res){
    try{
        const {slug} = req.user
        const user_slug = slug
        const sessions = await WorkoutSession.findAll({
            where: {
                user_slug: slug,
                check_out: { [Op.ne]: null }
            }
        });
        let totalHours =0
        sessions.forEach(session => {
            totalHours += session.duration;
        });

        const ongoingSession = await WorkoutSession.findOne({
            where: {
                user_slug,
                check_out: null, // Look for sessions where check_out is null
            },
            order: [['createdAt', 'DESC']], // Order by the most recent session
        });

        if(ongoingSession){
            const currentDuration = (new Date() - new Date(ongoingSession.check_in)) / (1000 * 60 * 60);
            totalHours += currentDuration
        }

        return res.status(200).json({
            code: 200,
            message: "Total time retrieved successfully",
            data: {
                slug: slug,
                duration: totalHours
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

async function getUserProgress(req, res){
    try{
        const { full_name, createdAt, slug } = req.user;
        const createdAtDate = new Date(createdAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }); // "1 Jan 2023"
        const sessions = await WorkoutSession.findAll({
            where: {
                user_slug: slug,
                check_out: { [Op.ne]: null }
            }
        });

        let totalHours = 0;
        sessions.forEach(session => {
            totalHours += session.duration;
        });

        const totalDays = Math.floor(totalHours / 24);

        const progressData = {
            full_name,
            createdAtDate,
            totalDays,
            totalHours
        };

        return res.status(200).json({
            code: 200,
            message: "User progress retrieved successfully",
            data: progressData
        });

    }
    catch(e){
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: "Server error",
            data: e.message
        });
    }
}


module.exports = {checkIn, checkOut, getCurrentSessionDuration, getTotalDuration, getUserProgress}