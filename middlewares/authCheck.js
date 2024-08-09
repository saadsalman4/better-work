const jwt = require('jsonwebtoken');
const {User_keys, User} = require('../connect');
const {TokenType} = require('../utils/constants')

const userAuth = async (req, res, next) => {
  let token = req.headers.authorization|| '';
  token = token.replace("Bearer","").replace(" ","")
  if (!token) {
    return res.status(401).json({
        code: 401,
        message: "Not logged in",
        data: []
    });
  }

  try {
    const checkKey = await User_keys.findOne({ where: {api_token: token, tokenType: TokenType.ATHLETE_ACCESS, is_active: true }});
    if(!checkKey){
        return res.status(401).json({
            code: 401,
            message: "Invalid token",
            data: []
        });
      }
    

    const decoded = jwt.verify(token, process.env.SECRET_KEY); 
    req.user = decoded;

    

    next();
  } catch (e) {
    console.log(e);
    return res.status(400).json({
        code: 400,
        message: 'Not logged in!',
        data: []
    });
  }
};

module.exports = {userAuth};