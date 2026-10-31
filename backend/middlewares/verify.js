const jwt = require ("jsonwebtoken");
const KEY = process.env.SPECIAL_KEY;
const verifyToken = ( req, res, next ) => {
    const fullToken = req.headers.authorization;
    if (!fullToken) return res.status(401).json("No token, unAuthorized access")
        const token = fullToken.split(" ") [1];

      jwt.verify(token, KEY, (err,user) => {
        if (err) return res.status(401).json("Session expired or token invalid, kindly re-login")

            req.user = user;
            next()

    })
}

//verify Role
const verifyRole = async (req, res, next) => {
    if (!req.user) return res.status(401).json("User needs to be authenticated")

        if (req.user.role !== "admin") return res.status(403).json("Forbidden Access, Admins only")
}



module.exports = { verifyToken, verifyRole }
