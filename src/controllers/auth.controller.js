require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");
const { isJwtExpired } = require("jwt-check-expiration");

// Models
const { User } = require("../database/models/index");

// Register a new User.
const register = async (req, res, next) => {

  let email = req.body.email;   // Get email from body.
  const password = await bcrypt.hash(req.body.password, 10);   // Encrypt password

  // CREATE new User.
  User.create({
    email,
    password,
  }).then((user) => {

    // Create userId into body request
    const userId = user.dataValues.id
    req.body.userId = userId
    next();

    // Return a response create User
    // res.status(200).json({ status: 200, msg: "Usuario creado correctamente", user });
  })
    .catch((error) => {
      // Creater User Error
      res.status(400).json({ status: 400, msg: error });
    })

};

// Sign In the app
const logIn = async (req, res) => {

  const { email, password } = req.body;

  // Very the email in the entity User
  User.findOne({
    where: { email: email },
  })
    .then((user) => {
      //Email invalido
      if (!user) {
        res.status(415).json({ msg: "Email invalido" });
      }

      //Them Email ok
      else if (bcrypt.compareSync(password, user.password)) {

        //Seteo un Token
        let token = jwt.sign(
          {
            id: user.id,
            email: user.email
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: process.env.TOKEN_EXPIRES || "8h" }
        );

        //Refresco el Token
        let refreshToken = jwt.sign(
          {
            id: user.id,
            email: user.email
          },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: process.env.TOKEN_EXPIRES || "8h" }
        );
        user.refreshToken = refreshToken;

        //Actualizo el token anterior
        try {
          User.update(
            { refreshToken: refreshToken },
            {
              where: {
                id: user.id,
              },
            }
          );
        } catch (error) {
          return res
            .status(401)
            .json({ msg: "Algo ha fallado update!", error });
        }
        return res.status(200).json({ user, token });

      }

      //Acceso denegado - Usuario y/o contraseña invalidos
      else {
        return res
          .status(401)
          .json({ msg: "Usuario y/o contraseña incorrecta" });
      }

    })
    .catch((error) => {
      //Fallo al buscar el email en la base de datos
      return res.status(400).json('email db error', error);
    });

};

const changePassword = async (req, res) => {

  let { password } = req.body;
  const jwt_cookie = req.cookies.jwt;
  password = await bcrypt.hash(password, 10);
  // console.log(jwt.verify(jwt_cookie, process.env.ACCESS_TOKEN_SECRET));

  // serach user by resetToken
  try {
    // received tokenCookie and the accessToken
    const verifyResult = jwt.verify(jwt_cookie, process.env.ACCESS_TOKEN_SECRET);

    const { email } = verifyResult;
    user = await User.findOne({
      where: {
        email: email,
      },
    });

    if (user) {
      try {
        // if user Exist, change the password in DB.
        await User.update(
          { password: password },
          {
            where: {
              id: user.id,
            },
          }
        );
      } catch (error) {
        return res.status(401).json({ msg: "Algo ha fallado!", error });
      }
      return res
        .status(201)
        .json({ status: "201", msg: "Contraseña cambiada correctamente" });

    } else {
      return res
        .status(400)
        .json({ status: "400", msg: "Usuario no encontrado" });
    }
  } catch (error) {
    return res.status(401).json({ msg: "Algo ha fallado jwt!", error });
  }

};

// Received token fot verify authorization
const isAuthenticated = async (req, res, next) => {
  // Verify if exist token and this is expired
  try {
    // Get Authorization
    if (req.headers['authorization'] && !isJwtExpired(req.headers['authorization'])) {
      // Received cadema
      let token = req.headers['authorization'];
      if (token) {
        token = token.substr(7, token.length);
        console.log(token);
      }

      // Decodify token
      const decodificada = await promisify(jwt.verify)(token, process.env.ACCESS_TOKEN_SECRET)
      const user = await User.findOne({
        where: {
          email: decodificada.email
        }
      })
      // if not find User
      if (!user) {
        res.status(500).json({ msg: 'Ha ocurrido un problema al decodificar el token' })
      } else {
        User.findByPk(user.dataValues.id).then(user => {
          //  Save user fot initSession
          req.user = { id: user.id, name: user.name, email: user.email, role: user.role },
            next();
        })
      }
    }
    else {
      res.status(401).json({ msg: "Debe iniciar sesión para continuar" })
    }
  } catch (err) {
    res.status(500).json(err.message)
  }
};

// Clear the cache Cookies
const logOut = async (req, res, next) => {
  //Eliminar cookie jwt
  res.clearCookie("jwt");
};

module.exports = {

  isAuthenticated,
  register,
  logIn,
  logOut,
  changePassword,

};