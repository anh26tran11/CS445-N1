import { Router } from "express";
import {
    getConversations,
    getConversationById,
    closeConversation,
    markAsRead,
} from "../controllers/supportChat.controller.js";
import auth from "../middleware/auth.js";

const supportChatRouter = Router();

supportChatRouter.get("/conversations", auth, getConversations);
supportChatRouter.get("/conversations/:id", auth, getConversationById);
supportChatRouter.patch("/conversations/:id/close", auth, closeConversation);
supportChatRouter.patch("/conversations/:id/read", auth, markAsRead);

export default supportChatRouter;