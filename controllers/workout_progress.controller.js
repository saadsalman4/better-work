const { Op } = require('sequelize')
const {WorkoutSession, WorkoutLog} = require('../connect')
const moment = require('moment')


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
    try {
        // Find the active session for the user
        const activeSession = await WorkoutSession.findOne({
            where: {
                user_slug: req.user.slug,
                check_out: null,
            },
        });

        if (!activeSession) {
            return res.status(400).json({
                code: 400,
                message: 'No active session found. Please check in first.',
            });
        }

        const checkOutTime = new Date();
        const checkInTime = new Date(activeSession.check_in);

        // Calculate duration in hours
        const duration = (checkOutTime - checkInTime) / (1000 * 60 * 60);

        // Update session with check-out time and duration
        await activeSession.update({
            check_out: checkOutTime,
            duration,
        });

        const checkInDate = checkInTime.toISOString().split('T')[0];
        const checkOutDate = checkOutTime.toISOString().split('T')[0];

        if (checkInDate === checkOutDate) {
            // If check-in and check-out are on the same day
            await WorkoutLog.create({
                user_slug: req.user.slug,
                date: checkInDate,
                hours: duration,
            });
        } else {
            let currentDate = new Date(checkInDate);

            while (currentDate <= new Date(checkOutDate)) {
                let hoursWorked = 0;

                if (currentDate.toDateString() === checkInTime.toDateString()) {
                    // Calculate hours from check-in to end of the day
                    const endOfDay = new Date(currentDate);
                    endOfDay.setHours(23, 59, 59, 999);
                    hoursWorked = (endOfDay - checkInTime) / (1000 * 60 * 60);
                } else if (currentDate.toDateString() === checkOutTime.toDateString()) {
                    // Calculate hours from start of the day to check-out
                    const startOfDay = new Date(currentDate);
                    startOfDay.setHours(0, 0, 0, 0);
                    hoursWorked = (checkOutTime - startOfDay) / (1000 * 60 * 60);
                } else {
                    // Full day of workout
                    hoursWorked = 24;
                }

                // Log the workout for the current date
                await WorkoutLog.create({
                    user_slug: req.user.slug,
                    date: currentDate.toISOString().split('T')[0],
                    hours: hoursWorked,
                });

                currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
            }
        }

        return res.status(200).json({
            code: 200,
            message: 'Check-out successful.',
            data: {
                session: activeSession,
                duration,
            },
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

async function getWeeklyData( req, res){
    try {
        const weekNumber = parseInt(req.params.weekNumber, 10);
        const userSlug = req.user.slug;



        const createdAtDate = new Date(req.user.createdAt);

        // Calculate the start date of the specified week
        const startDate = new Date(createdAtDate);
        startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);

        // Calculate the end date of the specified week
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);

        // Fetch workout logs for the user within the specified date range
        const workoutLogs = await WorkoutLog.findAll({
            where: {
                user_slug: userSlug,
                date: {
                    [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
                },
            },
        });

        // Prepare the response data
        const weeklyData = {};
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + i);
            const dateString = currentDate.toISOString().split('T')[0];
            weeklyData[dateString] = 0;
        }

        workoutLogs.forEach(log => {
            weeklyData[log.date] = log.hours;
        });

        return res.status(200).json({
            code: 200,
            message: 'Weekly data retrieved successfully',
            data: weeklyData,
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

async function getMonthlyData(req, res) {
    try {
        const monthNumber = parseInt(req.params.monthNumber, 10);
        const userSlug = req.user.slug;
        const year = new Date().getFullYear(); // Assuming current year or customize as needed

        // Calculate the start and end dates for the specified month
        const startDate = moment(`${year}-${monthNumber}-01`).startOf('month').format('YYYY-MM-DD');
        const endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');

        // Fetch workout logs for the user within the specified date range
        const workoutLogs = await WorkoutLog.findAll({
            where: {
                user_slug: userSlug,
                date: {
                    [Op.between]: [startDate, endDate],
                },
            },
            attributes: ['date'], // Only retrieve the date field
        });

        // Extract unique workout dates
        const uniqueDates = [...new Set(workoutLogs.map(log => log.date))];

        return res.status(200).json({
            code: 200,
            message: 'Monthly data retrieved successfully',
            data: uniqueDates,
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

async function getYearlyData(req, res) {
    try {
        const yearNumber = parseInt(req.params.yearNumber, 10);
        const userSlug = req.user.slug;

        // Calculate the start and end dates for the specified year
        const startDate = `${yearNumber}-01-01`;
        const endDate = `${yearNumber}-12-31`;

        // Fetch workout logs for the user within the specified date range
        const workoutLogs = await WorkoutLog.findAll({
            where: {
                user_slug: userSlug,
                date: {
                    [Op.between]: [startDate, endDate],
                },
            },
            attributes: ['date', 'hours'],
        });

        // Initialize an array to store total hours per month
        const monthlyHours = Array(12).fill(0);

        // Calculate total hours for each month
        workoutLogs.forEach(log => {
            const month = new Date(log.date).getMonth(); // Get month index (0-11)
            monthlyHours[month] += log.hours;
        });

        // Prepare the response data
        const responseData = monthlyHours.map((hours, index) => ({
            month: index + 1, // 1-based month index
            hours: parseFloat(hours.toFixed(2)) // Format hours to 2 decimal places
        }));

        return res.status(200).json({
            code: 200,
            message: 'Yearly data retrieved successfully',
            data: responseData,
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

module.exports = {checkIn, checkOut, getCurrentSessionDuration, 
    getTotalDuration, getUserProgress, getWeeklyData, getMonthlyData, getYearlyData}