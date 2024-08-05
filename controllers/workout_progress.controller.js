const { Op } = require('sequelize')
const {WorkoutSession, WorkoutLog} = require('../connect')
const moment = require('moment')


async function checkIn(req, res) {
    const { slug } = req.user; // Extract user slug from authenticated user
    const user_slug = slug;
    const { localTime } = req.body; // Expect localTime in ISO format, e.g., '2024-08-05T10:30:00'

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
                data: [],
            });
        }

        // Parse localTime into a Date object
        const localDateTime = new Date(localTime);
        if (isNaN(localDateTime.getTime())) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid local time format.',
                data: [],
            });
        }

        // Create a new workout session with the provided local time
        const newSession = await WorkoutSession.create({
            user_slug,
            check_in: localDateTime.toISOString(),
        });

        return res.status(200).json({
            code: 200,
            message: 'Checked in successfully',
            data: {
                slug: newSession.slug,
                check_in: newSession.check_in,
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

async function checkOut(req, res) {
    const { slug } = req.user; // Extract user slug from authenticated user
    const { localTime } = req.body; // Expect localTime in ISO format, e.g., '2024-08-05T10:30:00'

    try {
        // Find the active session for the user
        const activeSession = await WorkoutSession.findOne({
            where: {
                user_slug: slug,
                check_out: null,
            },
        });

        if (!activeSession) {
            return res.status(400).json({
                code: 400,
                message: 'No active session found. Please check in first.',
            });
        }

        // Parse localTime into a Date object
        const checkOutTime = new Date(localTime);
        if (isNaN(checkOutTime.getTime())) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid local time format.',
                data: [],
            });
        }

        const checkInTime = new Date(activeSession.check_in);

        // Calculate duration in hours
        const duration = (checkOutTime - checkInTime) / (1000 * 60 * 60);

        // Update session with check-out time and duration
        await activeSession.update({
            check_out: checkOutTime.toISOString(),
            duration,
        });

        const checkInDate = checkInTime.toISOString().split('T')[0];
        const checkOutDate = checkOutTime.toISOString().split('T')[0];

        if (checkInDate === checkOutDate) {
            // If check-in and check-out are on the same day
            await WorkoutLog.create({
                user_slug: slug,
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
                    user_slug: slug,
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

async function getWeeklyData(req, res) {
    try {
        // Extract the start date from the request parameters
        const { startDate } = req.params;
        const userSlug = req.user.slug;

        // Parse the provided start date
        const startDateObj = new Date(startDate);

        // Calculate the end date (7 days from start date)
        const endDateObj = new Date(startDateObj);
        endDateObj.setDate(startDateObj.getDate() + 6);

        // Fetch workout logs for the user within the specified date range
        const workoutLogs = await WorkoutLog.findAll({
            where: {
                user_slug: userSlug,
                date: {
                    [Op.between]: [startDateObj.toISOString().split('T')[0], endDateObj.toISOString().split('T')[0]],
                },
            },
        });

        // Prepare the response data with weekday names
        const weeklyData = {};
        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDateObj);
            currentDate.setDate(startDateObj.getDate() + i);
            const weekdayName = weekdays[currentDate.getDay()];
            weeklyData[weekdayName] = 0;
        }

        workoutLogs.forEach(log => {
            const logDate = new Date(log.date);
            const weekdayName = weekdays[logDate.getDay()];
            weeklyData[weekdayName] = (weeklyData[weekdayName] || 0) + log.hours;
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
        const { date } = req.params; // Get the full date (YYYY-MM-DD) from params
        const userSlug = req.user.slug;

        // Parse the provided date to extract the year and month
        const startDate = moment(date, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
        const endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');

        // Fetch workout logs for the user within the specified date range
        const workoutLogs = await WorkoutLog.findAll({
            where: {
                user_slug: userSlug,
                date: {
                    [Op.between]: [startDate, endDate],
                },
            },
            attributes: ['date', 'hours'], // Retrieve date and hours fields
        });

        // Aggregate total hours worked out per day
        const dailyTotals = workoutLogs.reduce((acc, log) => {
            if (acc[log.date]) {
                acc[log.date] += log.hours;
            } else {
                acc[log.date] = log.hours;
            }
            return acc;
        }, {});

        return res.status(200).json({
            code: 200,
            message: 'Monthly data retrieved successfully',
            data: dailyTotals,
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
        const yearNumber = parseInt(req.params.year, 10); // Get the year from params
        const userSlug = req.user.slug;

        // Define an object to map month numbers to month names
        const monthNames = {
            1: "January",
            2: "February",
            3: "March",
            4: "April",
            5: "May",
            6: "June",
            7: "July",
            8: "August",
            9: "September",
            10: "October",
            11: "November",
            12: "December"
        };

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

        console.log(workoutLogs)

        // Initialize an object to hold the total hours per month
        const monthlyData = {};
        Object.keys(monthNames).forEach(month => {
            monthlyData[monthNames[month]] = 0;
        });

        // Aggregate total hours per month
        workoutLogs.forEach(log => {
            const logMonth = new Date(log.date).getMonth() + 1; // Month is 0-indexed
            const monthName = monthNames[logMonth];
            monthlyData[monthName] += log.hours;
        });

        return res.status(200).json({
            code: 200,
            message: 'Yearly data retrieved successfully',
            data: monthlyData,
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