
import { Request, Response } from "express";
import db from "../database";
import xss from "xss";


export const criarComentario = async (req: Request, res: Response) => {
    const { texto } = req.body;

    const usuarioId = res.locals.payload.id;


    let textoLimpo = xss(texto);

    const query = `INSERT INTO comentario (texto, usuario_id) VALUES ($1, $2)`;

    // Log para você acompanhar no terminal do laboratório
    console.log(`Comentário recebido de forma segura do usuário ID: ${usuarioId}`);

    try {
        await db.query(query, [textoLimpo, usuarioId]);

        return res.status(201).json({
            success: true,
            message: "Comentário criado com sucesso!"
        });

    } catch (error: any) {
        console.error("Erro ao inserir comentário:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
};


export const listarComentarios = async (
    _req: Request,
    res: Response
) => {

    try {

        const result = await db.query(
            "SELECT * FROM comentario"
        );

        res.json(result.rows);

    } catch (err: any) {
        console.error("Erro ao listar comentários:", err);
        res.status(500).json({
            error: "Erro interno do servidor"
        });

    }
};
