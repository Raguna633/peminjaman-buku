import express from 'express';
import authRoutes from './auth.js';
import transaksiRoutes from './transaksi.js';
import notifikasiRoutes from './notifikasi.js';
import settingsRoutes from './settings.js';
import kategoriRoutes from './kategori.js';
import bukuRoutes from './buku.js';
import userRoutes from './user.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/transaksi', transaksiRoutes);
router.use('/notifikasi', notifikasiRoutes);
router.use('/settings', settingsRoutes);
router.use('/kategori', kategoriRoutes);
router.use('/buku', bukuRoutes);
router.use('/user', userRoutes);

export default router;
