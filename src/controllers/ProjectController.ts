import type { Request, Response } from "express";
import Project from "../models/Project";

export class ProjectController {
  static createProject = async (req: Request, res: Response) => {
    const project = new Project(req.body);
    // Asigna Manager
    project.manager = req.user.id;
    try {
      await project.save();
      res.send("Proyecto Creado Correctamente");
    } catch (error) {
      console.log(error.message);
    }
  };

  static getAllProjects = async (req: Request, res: Response) => {
    try {
      const projects = await Project.find({
        $or: [{ manager: { $in: req.user.id } }],
      });
      res.json(projects);
    } catch (error) {
      console.log(error);
    }
  };

  static getProjectById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const project = await Project.findById(id).populate("tasks");
      if (!project) {
        const error = new Error("Proyecto no encontrado");
        return res.status(404).json({ error: error.message });
      }
      if (project.manager.toString() !== req.user.id.toString()) {
        const error = new Error("Accion no valida");
        return res.status(404).json({ error: error.message });
      }
      res.json(project);
    } catch (error) {
      console.log(error);
    }
  };

  static updateProject = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const project = await Project.findById(id);
      if (!project) {
        const error = new Error("Proyecto no encontrado");
        return res.status(404).json({ error: error.message });
      }
      if (project.manager.toString() !== req.user.id.toString()) {
        const error = new Error(
          "Accion no valida, solo el manager puede actualiar un proyecto"
        );
        return res.status(404).json({ error: error.message });
      }
      project.projectName = req.body.projectName;
      project.clientName = req.body.clientName;
      project.description = req.body.description;
      await project.save();
      res.send("Proyecto Actualizado");
    } catch (error) {
      console.log(error);
    }
  };

  static deleteProject = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const project = await Project.findById(id);
      if (!project) {
        const error = new Error("Proyecto no encontrado");
        return res.status(404).json({ error: error.message });
      }
      if (project.manager.toString() !== req.user.id.toString()) {
        const error = new Error(
          "Accion no valida, solo el manager puede eliminar un proyecto"
        );
        return res.status(404).json({ error: error.message });
      }
      await Project.deleteOne();
      res.send("Proyecto Eliminado");
    } catch (error) {
      console.log(error);
    }
  };
}
