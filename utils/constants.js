
// Enum for user roles
const UserRole = {
    ATHLETE: 'athlete',
    COACH: 'coach',
    ADMIN: 'admin'
};

// Enum for OTP types
const OTPType = {
    VERIFY: 'verify',
    RESET: 'reset'
};

// Enum for token types
const TokenType = {
    ATHLETE_ACCESS: 'athlete_access',
    COACH_ACCESS: 'coach_access',
    ATHLETE_RESET: 'athlete_reset',
    COACH_RESET: 'coach_reset'
};


// Exporting all enums
module.exports = {
    UserRole,
    OTPType,
    TokenType
};
