import express from 'express';
import { body } from 'express-validator';
import AuthController from '../controllers/AuthController.js';
import auth, { requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API untuk otentikasi dan manajemen sesi
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Daftar user baru
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               nis:
 *                 type: string
 *               nama_lengkap:
 *                 type: string
 *     responses:
 *       201:
 *         description: User berhasil terdaftar
 *       400:
 *         description: Validasi gagal
 */
router.post(
  '/register',
  [
    body('username').notEmpty().isLength({ min: 3, max: 50 }),
    body('password').notEmpty().isLength({ min: 6 }),
    body('email').optional().isEmail(),
    body('nis').optional().isString(),
  ],
  AuthController.register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login berhasil
 *       401:
 *         description: Username atau password salah
 */
router.post(
  '/login',
  [
    body('username').notEmpty().isLength({ min: 3, max: 50 }),
    body('password').notEmpty().isLength({ min: 6 }),
  ],
  AuthController.login
);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Ambil profil user yang sedang login
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data profil user
 *       401:
 *         description: Tidak terautentikasi
 */
router.get('/profile', auth, AuthController.getProfile);

/**
 * @swagger
 * /auth/duty-status:
 *   put:
 *     summary: Toggle status berjaga admin
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status berjaga berhasil diubah
 *       403:
 *         description: Bukan admin
 */
router.put('/duty-status', auth, requireRole(['admin']), AuthController.toggleDutyStatus);

/**
 * @swagger
 * /auth/check-duty:
 *   get:
 *     summary: Cek apakah ada admin yang sedang berjaga
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Status ketersediaan admin
 */
router.get('/check-duty', AuthController.checkDuty);

export default router;
