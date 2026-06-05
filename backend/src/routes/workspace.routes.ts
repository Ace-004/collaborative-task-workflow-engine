import { requireWorkspaceRole } from "./../middleware/role.middleware.js";
import express, { Router } from "express";
import {
  createWorkspace,
  deleteWorkspace,
  getAllWorkspace,
  getWorkspaceById,
  joinWorkspace,
  getAllAvailableWorkspaces,
  getWorkspaceMembers,
} from "../controllers/workspace.controller.js";
import { verifyUser } from "../middleware/auth.middleware.js";

const router: Router = express.Router();

router.post("/create", verifyUser, createWorkspace);
router.post("/join", verifyUser, joinWorkspace);
router.get("/available", verifyUser, getAllAvailableWorkspaces);
router.get("/members/:workspace_id", verifyUser, getWorkspaceMembers);
router.get("/", verifyUser, getAllWorkspace);
router.get(
  "/:id",
  verifyUser,
  requireWorkspaceRole(["admin", "member"]),
  getWorkspaceById,
);
router.delete(
  "/:id",
  verifyUser,
  requireWorkspaceRole(["admin"]),
  deleteWorkspace,
);

export default router;
