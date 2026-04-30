const z = require('zod');

const validateRegister = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(3),
});

const validateLogin = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

module.exports = {validateRegister, validateLogin}
