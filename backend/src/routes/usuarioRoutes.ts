import { Router } from "express";
import { login, atualizarIptu, novoLogin, getIptuPorIdUsuario, getQRCodeOrCodBarras, getIptus, payloadUsuario } from "../controllers/usuarioController";
import { authMiddleware } from "../middleware/authMiddleware";
import { csrfTokenMiddleware } from "../middleware/csrfTokenMiddleware";
import { csrfGerarTokenMiddleware as csrfGerarRecuperarTokenMiddleware } from "../middleware/csrfGerarRecuperarTokenMiddleware";

const router = Router();

router.post("/login", csrfGerarRecuperarTokenMiddleware, login);
router.post("/novo-login", csrfGerarRecuperarTokenMiddleware, novoLogin);
router.post("/atualizar-iptu", authMiddleware(), csrfTokenMiddleware, atualizarIptu);
router.get("/iptu-por-usuario", authMiddleware(), getIptuPorIdUsuario);
router.get("/payload-usuario", authMiddleware(), csrfGerarRecuperarTokenMiddleware, payloadUsuario);
router.get("/codigo-qr-ou-barra", authMiddleware(), getQRCodeOrCodBarras);
router.get("/iptus", authMiddleware([1, 2]), getIptus);

export default router;