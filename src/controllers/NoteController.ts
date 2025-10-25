import type { Request, Response } from "express";

export class NoteController {
  static createNote = async (req: Request, res: Response) => {
    console.log(req.body);
  };
}
