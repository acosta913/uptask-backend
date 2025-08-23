import { Router } from "express";
import { ProjectController } from "../controllers/ProjectController";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { TaskController } from "../controllers/TaskController";
import { projectExists } from "../middleware/project";
import { tasktBelongsToProject, tasktExists } from "../middleware/task";

const routes = Router();

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
routes.param("taskId", tasktExists);
routes.param("taskId", tasktBelongsToProject);
routes.post(
  "/:projectId/tasks",
  body("name").notEmpty().withMessage("Nombre de la tarea Obligatorio"),
  body("description")
    .notEmpty()
    .withMessage("Descripcion de la tarea Obligatorio"),
  handleInputErrors,
  TaskController.createTask
);

routes.get("/:projectId/tasks", TaskController.getProjectTask);

routes.get(
  "/:projectId/tasks/:taskId",
  param("taskId").isMongoId().withMessage("ID no valido"),
  handleInputErrors,
  TaskController.getTaskById
);

routes.put(
  "/:projectId/tasks/:taskId",
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
export default routes;
