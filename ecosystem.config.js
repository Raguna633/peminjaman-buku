export const apps = [
    {
        name: "peminjaman-buku-backend",
        script: "app.js",
        cwd: "./server",
        env: { NODE_ENV: "production" }
    },
    {
        name: "peminjaman-buku-nginx",
        script: "./nginx/nginx.exe",
        cwd: "./nginx", // Jalankan dari direktori nginx agar path relatif bekerja
        args: "-p ./" // Memastikan nginx mencari config di folder lokalnya
    }
];