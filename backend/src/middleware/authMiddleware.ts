import { NextFunction, Request, Response } from "express";
import ValidarToken from "../Services/jwtServices";

export const authMiddleware = (perfis: number[] = []) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const token = req.cookies.token;
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Token não fornecido"
            });
            return;
        }
        const payload = ValidarToken(token);

        if (!payload) {
            res.status(401).json({
                success: false,
                message: "Token inválido"
            });
            return;
        }
        if (perfis.length > 0 && payload && !perfis.includes(Number(payload.tipo))) {
            res.status(403).json({
                success: false,
                message: "Acesso não autorizado"
            });
            return;
        }
        res.locals.payload = payload;
        next();
    };
};
