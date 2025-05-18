const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if(authHeader){
        const token = authHeader.split(' ')[1];
        if(token){
            jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
                if(err){
                    return res.status(403).json({ message: 'Token inválido' });
                }
                req.user = user.id;
                next();
            });
        }
    } else {
        return res.status(401).json({ message: 'No se proporcionó token' });
    }
};

module.exports = authMiddleware;