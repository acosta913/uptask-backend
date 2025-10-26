import { Router } from "express";
import { ProjectController } from "../controllers/ProjectController";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { TaskController } from "../controllers/TaskController";
import { projectExists } from "../middleware/project";
import {
  hasAuthorization,
  tasktBelongsToProject,
  tasktExists,
} from "../middleware/task";
import { authenticate } from "../middleware/auth";
import { TeamMemberController } from "../controllers/TeamController";
import { NoteController } from "../controllers/NoteController";

const routes = Router();
routes.use(authenticate);

routes.post(
  "/",
  body("projectName").notEmpty().withMessage("Nombre del Proyecto Obligatorio"),
  body("clientName").notEmpty().withMessage("Nombre del Cliente Obligatorio"),
  body("description")
    .notEmpty()
    .withMessage("Descripcion del Proyecto Obligatorio"),
  handleInputErrors,
  ProjectController.createProject
);

routes.get("/", ProjectController.getAllProjects);

routes.get(
  "/:id",
  param("id").isMongoId().withMessage("ID no valido"),
  handleInputErrors,
  ProjectController.getProjectById
);

routes.put(
  "/:id",
  param("id").isMongoId().withMessage("ID no valido"),
  body("projectName").notEmpty().withMessage("Nombre del Proyecto Obligatorio"),
  body("clientName").notEmpty().withMessage("Nombre del Cliente Obligatorio"),
  body("description")
    .notEmpty()
    .withMessage("Descripcion del Proyecto Obligatorio"),
  handleInputErrors,
  ProjectController.updateProject
);

routes.delete(
  "/:id",
  param("id").isMongoId().withMessage("ID no valido"),
  handleInputErrors,
  ProjectController.deleteProject
);

/** Routes for tasks */
routes.param("projectId", projectExists);
routes.post(
  "/:projectId/tasks",
  hasAuthorization,
  body("name").notEmpty().withMessage("Nombre de la tarea Obligatorio"),
  body("description")
    .notEmpty()
    .withMessage("Descripcion de la tarea Obligatorio"),
  handleInputErrors,
  TaskController.createTask
);

routes.get("/:projectId/tasks", TaskController.getProjectTask);

routes.param("taskId", tasktExists);
routes.param("taskId", tasktBelongsToProject);
routes.get(
  "/:projectId/tasks/:taskId",
  param("taskId").isMongoId().withMessage("ID no valido"),
  handleInputErrors,
  TaskController.getTaskById
);

routes.put(
  "/:projectId/tasks/:taskId",
  hasAuthorization,
  param("taskId").isMongoId().withMessage("ID no valido"),
  body("name").notEmpty().withMessage("Nombre de la tarea Obligatorio"),
  body("description")
    .notEmpty()
    .withMessage("Descripcion de la tarea Obligatorio"),
  handleInputErrors,
  TaskController.updateTask
);

routes.delete(
  "/:projectId/tasks/:taskId",
  hasAuthorization,
  param("taskId").isMongoId().withMessage("ID no valido"),
  handleInputErrors,
  TaskController.daleteTask
);

routes.post(
  "/:projectId/tasks/:taskId/status",
  param("taskId").isMongoId().withMessage("ID no valido"),
  body("status").notEmpty().withMessage("El estado es obligatorio"),
  handleInputErrors,
  TaskController.updateStatusTask
);

/** Routes for teams */
routes.post(
  "/:projectId/team/find",
  body("email").isEmail().toLowerCase().withMessage("E-mail no valido"),
  handleInputErrors,
  TeamMemberController.findMemberByEmail
);

routes.get("/:projectId/team", TeamMemberController.getProjectTeam);

routes.post(
  "/:projectId/team",
  body("id").isMongoId().withMessage("ID no valido"),
  handleInputErrors,
  TeamMemberController.addMemberById
);

routes.delete(
  "/:projectId/team/:userId",
  param("userId").isMongoId().withMessage("ID no valido"),
  handleInputErrors,
  TeamMemberController.removeMemberById
);

/** Routes for notes */
routes.post(
  "/:projectId/tasks/:taskId/notes",
  body("content")
    .notEmpty()
    .withMessage("El Contenido de la nota es requerido"),
  handleInputErrors,
  NoteController.createNote
);

routes.get("/:projectId/tasks/:taskId/notes", NoteController.getTaskNotes);

routes.delete(
  "/:projectId/tasks/:taskId/notes/:noteId",
  param("noteId").isMongoId().withMessage("ID No Valido"),
  handleInputErrors,
  NoteController.deleteNote
);

export default routes;
