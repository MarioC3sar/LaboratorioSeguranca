import { Request, Response } from "express";
import db from "../database";
import jwt from "jsonwebtoken";
import xss from "xss";
import bcrypt from "bcrypt";


export const payloadUsuario = async (req: Request, res: Response) => {

    return res.json({
        success: true,
        message: "Payload do usuário obtido com sucesso",
        payload: res.locals.payload,
        cryptoToken: res.locals.csrfToken
    });
};


export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const query = `SELECT * FROM usuario WHERE email = $1`;
        console.log(`Query Executada: ${query}`);
        const result = await db.query(query, [email]);

        if (result.rowCount && result.rowCount > 0) {
            const user = result.rows[0];


            const senhaValida = await bcrypt.compare(password, user.senha);

            if (senhaValida) {
                const token = jwt.sign(
                    {
                        id: user.id,
                        nome: user.nome,
                        email: user.email,
                        tipo: user.tipo_usuario_id
                    },
                    (global as any).segredoJwt
                );

                res.cookie("token", token, { httpOnly: true, sameSite: "strict" });

                return res.json({
                    success: true,
                    cryptoToken: res.locals.csrfToken
                });
            }
        }

        return res.status(401).json({
            success: false,
            message: "E-mail ou senha incorretos"
        });

    } catch (error: any) {
        console.error("Erro no login:", error);
        return res.status(500).json({ success: false, message: "Erro interno" });
    }
};

export const novoLogin = async (req: Request, res: Response) => {
    try {
        const { email, password, nome } = req.body;


        const queryNomeIpuExiste = `SELECT * FROM iptu WHERE nome = $1`;
        const iptuResult = await db.query(queryNomeIpuExiste, [nome]);

        if (iptuResult.rowCount && iptuResult.rowCount > 0) {

            const salt = await bcrypt.genSalt(10);
            const senhaHash = await bcrypt.hash(password, salt);

            const queryInsert = `
                INSERT INTO usuario (email, senha, nome, tipo_usuario_id)
                VALUES ($1, $2, $3, 4) RETURNING id, email, nome`;

            const resultInsert = await db.query(queryInsert, [email, senhaHash, nome]);
            const novoUsuario = resultInsert.rows[0];

            const queryUpdateTabelaIptu = `
                UPDATE iptu
                SET usuario_id = $1
                WHERE nome = $2
            `;
            const resultUpdate = await db.query(queryUpdateTabelaIptu, [novoUsuario.id, nome]);

            if (resultInsert.rowCount && resultInsert.rowCount > 0 && resultUpdate.rowCount && resultUpdate.rowCount > 0) {
                return res.json({
                    success: true,
                    user: novoUsuario
                });
            } else {
                return res.status(400).json({ success: false, message: "Falha ao vincular IPTU" });
            }

        } else {
            return res.status(404).json({
                success: false,
                message: `Nome '${nome}' não encontrado no cadastro de munícipes`
            });
        }
    } catch (error: any) {
        console.error("Erro no cadastro:", error);
        return res.status(500).json({ success: false, message: "Erro interno", detalhe: error.message });
    }
};



export const atualizarIptu = async (req: Request, res: Response) => {
    const { novoValor } = req.body;
    const payload = res.locals.payload;

    let usuarioIdAlvo;

    if (payload.tipo === 1) {

        usuarioIdAlvo = req.body.usuarioId;
        console.log(`[Segurança] Admin ID ${payload.id} alterando IPTU do usuário ID ${usuarioIdAlvo}`);
    } else {
        // Se for um usuário comum, IGNORAMOS o req.body e cravamos o ID dele mesmo.
        usuarioIdAlvo = payload.id;
        console.log(`[Segurança] Usuário comum ID ${payload.id} alterando o próprio IPTU`);
    }

    const query = `
        UPDATE iptu
        SET valor = $1
        WHERE usuario_id = $2
    `;

    try {
        await db.query(query, [novoValor, usuarioIdAlvo]);

        res.json({
            message: "IPTU atualizado com sucesso"
        });

    } catch (err: any) {
        console.error("Erro ao atualizar IPTU:", err);
        res.status(500).json({
            error: "Erro interno do servidor"
        });
    }
};


export const getIptuPorIdUsuario = async (req: Request, res: Response) => {

    const query = `SELECT * FROM iptu WHERE usuario_id = $1`;

    console.log(`Query Executada: ${query}`);

    try {
        const result = await db.query(query, [res.locals.payload.id]);

        res.json({
            iptu: result.rows
        });

    } catch (err: any) {
        console.error("Erro ao buscar IPTU do usuário:", err);
        res.status(500).json({
            error: "Erro interno do servidor"
        });
    }
};


export const getIptus = async (req: Request, res: Response) => {

    const query = `SELECT * FROM iptu`;

    try {
        const result = await db.query(query);

        res.json({
            iptu: result.rows
        });

    } catch (err: any) {
        console.error("Erro ao listar todos os IPTUs:", err);
        res.status(500).json({
            error: "Erro interno do servidor"
        });
    }
};


export const getQRCodeOrCodBarras = async (req: Request, res: Response) => {
    const tipo = req.query.tipo as string;
    let codigoHtml = "";

    if (tipo === "codigoDeBarras") {
        codigoHtml = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=123456789" />`;
    } else if (tipo === "qrcode") {
        codigoHtml = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QRCodeDemo" />`;
    }


    const tipoLimpo = typeof tipo === "string" ? xss(tipo) : "Tipo Inválido";

    res.send(`
        <h2>Tipo selecionado: ${tipoLimpo}</h2>
        ${codigoHtml}
    `);

};
