import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { body } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { AuthEmail } from "../emails/AuthEmail";

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

export default router;
