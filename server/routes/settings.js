import express from 'express';
import SettingsController from '../controllers/SettingsController.js';
import auth, { requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Konfigurasi sistem (Admin only)
 */

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Ambil setting aplikasi
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Konfigurasi berhasil dimuat
 */
router.get('/', auth, requireRole(['admin']), SettingsController.getSettings);

/**
 * @swagger
 * /settings:
 *   put:
 *     summary: Update setting aplikasi
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Setting berhasil disimpan
 */
router.put('/', auth, requireRole(['admin']), SettingsController.updateSettings);

export default router;
