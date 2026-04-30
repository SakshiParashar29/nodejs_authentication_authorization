const bcrypt = require('bcryptjs');

const hashPassword = async(password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedpasskey = await bcrypt.hash(password, salt);
        
        return hashedpasskey;
    } catch (error) {
        console.log("Error in hashPassword -> ", error);
    }
} 

module.exports = hashPassword