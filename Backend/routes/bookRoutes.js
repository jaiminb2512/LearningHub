import { Router } from "express";
import { loggedIn } from "../middleware/auth.js";
import {
  createBookHandler,
  deleteBookHandler,
  getAllBooksHandler,
  getBookByIdHandler,
  updateBookHandler,
} from "../controllers/bookController.js";
import {
  createNoteHandler,
  deleteNoteHandler,
  getNoteByIdHandler,
  getNotesByBookHandler,
  reorderNotesHandler,
  updateNoteHandler,
} from "../controllers/noteController.js";

const router = Router();

router.use(loggedIn);

router.post("/", createBookHandler);
router.get("/", getAllBooksHandler);
router.get("/:bookId", getBookByIdHandler);
router.put("/:bookId", updateBookHandler);
router.delete("/:bookId", deleteBookHandler);

router.post("/:bookId/notes", createNoteHandler);
router.get("/:bookId/notes", getNotesByBookHandler);
router.put("/:bookId/notes/reorder", reorderNotesHandler);
router.get("/:bookId/notes/:noteId", getNoteByIdHandler);
router.put("/:bookId/notes/:noteId", updateNoteHandler);
router.delete("/:bookId/notes/:noteId", deleteNoteHandler);

export default router;
