import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { AuthEmail } from "../emails/AuthEmail";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post(
  "/create-account",
  body("name").notEmpty().withMessage("El nombre es requerido"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("El password es muy corto, minimo 8 caracteres"),
  body("password_confirmation").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("El password no coincide");
    }
    return true;
  }),
  body("email").isEmail().withMessage("E-mail no valido"),
  handleInputErrors,
  AuthController.createAccount
);

router.post(
  "/confirm-account",
  body("token").notEmpty().withMessage("El Token es requerido"),
  handleInputErrors,
  AuthController.confirmAccount
);

router.post(
  "/login",
  body("email").isEmail().withMessage("E-mail no valido"),
  body("password").notEmpty().withMessage("El password es requerido"),
  handleInputErrors,
  AuthController.login
);

router.post(
  "/request-code",
  body("email").isEmail().withMessage("E-mail no valido"),
  handleInputErrors,
  AuthController.requestConfirmationCode
);

router.post(
  "/forgot-password",
  body("email").isEmail().withMessage("E-mail no valido"),
  handleInputErrors,
  AuthController.forgotPassword
);

router.post(
  "/validate-token",
  body("token").notEmpty().withMessage("El Token es requerido"),
  handleInputErrors,
  AuthController.validateToken
);

router.post(
  "/update-password/:token",
  param("token").isNumeric().withMessage("Token no valido"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("El password es muy corto, minimo 8 caracteres"),
  body("password_confirmation").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("El password no coincide");
    }
    return true;
  }),
  handleInputErrors,
  AuthController.updatePasswordWithToken
);

router.get("/user", authenticate, AuthController.user);

/**Profile */
router.put(
  "/profile",
  authenticate,
  body("name").notEmpty().withMessage("El nombre es requerido"),
  body("email").isEmail().withMessage("E-mail no valido"),
  handleInputErrors,
  AuthController.updateProfile
);

router.post(
  "/update-password",
  authenticate,
  body("current_password")
    .notEmpty()
    .withMessage("El password actual es requerido"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("El password es muy corto, minimo 8 caracteres"),
  body("password_confirmation").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("El password no coincide");
    }
    return true;
  }),
  handleInputErrors,
  AuthController.updateCurrentUserPassword
);

router.post(
  "/check-password",
  authenticate,
  body("password").notEmpty().withMessage("El password es requerido"),
  handleInputErrors,
  AuthController.checkPassword
);

export default router;
