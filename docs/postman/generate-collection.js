/**
 * Generator script for Postman Collection JSON
 * Run: node docs/postman/generate-collection.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Helpers ────────────────────────────────────────────────
const STD_TESTS = `
pm.test("Response time < 2000ms", () => pm.expect(pm.response.responseTime).to.be.below(2000));
pm.test("Content-Type is JSON", () => pm.response.to.have.header("Content-Type", /json/));
`;

function makeReq(name, method, url, { auth, body, tests, prereq } = {}) {
  const r = {
    name,
    request: {
      method,
      header: [{ key: "Content-Type", value: "application/json" }],
      url: { raw: url, host: ["{{base_url}}"], path: url.replace("{{base_url}}/", "").split("/") },
    },
    response: [],
  };
  if (auth) {
    r.request.header.push({ key: "Authorization", value: `Bearer {{${auth}}}` });
  }
  if (body) {
    r.request.body = { mode: "raw", raw: JSON.stringify(body, null, 2) };
  }
  if (tests) {
    r.event = r.event || [];
    r.event.push({ listen: "test", script: { type: "text/javascript", exec: (STD_TESTS + tests).split("\n") } });
  }
  if (prereq) {
    r.event = r.event || [];
    r.event.push({ listen: "prerequest", script: { type: "text/javascript", exec: prereq.split("\n") } });
  }
  return r;
}

function folder(name, items) {
  return { name, item: items };
}

// ─── 00. Setup & Auth ───────────────────────────────────────
const f00 = folder("00. Setup & Auth", [
  makeReq("Login Admin", "POST", "{{base_url}}/auth/login", {
    body: { username: "{{admin_username}}", password: "{{admin_password}}" },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Login success & token saved", () => {
    const json = pm.response.json();
    pm.expect(json.success).to.be.true;
    pm.expect(json.data).to.have.property("token");
    pm.expect(json.data.user.role).to.eql("admin");
    pm.environment.set("admin_token", json.data.token);
});`
  }),
  makeReq("Login User", "POST", "{{base_url}}/auth/login", {
    body: { username: "{{user_username}}", password: "{{user_password}}" },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Login success & token saved", () => {
    const json = pm.response.json();
    pm.expect(json.success).to.be.true;
    pm.expect(json.data).to.have.property("token");
    pm.expect(json.data.user.role).to.eql("user");
    pm.environment.set("user_token", json.data.token);
    pm.environment.set("user_id_for_flow", json.data.user.id);
});`
  }),
  makeReq("Get Profile (Admin)", "GET", "{{base_url}}/auth/profile", {
    auth: "admin_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Profile has required fields, no password", () => {
    const u = pm.response.json().data;
    pm.expect(u).to.have.property("id");
    pm.expect(u).to.have.property("username");
    pm.expect(u).to.have.property("role");
    pm.expect(u).to.not.have.property("password");
});`
  }),
  makeReq("Get Profile (User)", "GET", "{{base_url}}/auth/profile", {
    auth: "user_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Profile role is user", () => {
    pm.expect(pm.response.json().data.role).to.eql("user");
});`
  }),
  makeReq("Toggle Duty Status (ON)", "PUT", "{{base_url}}/auth/duty-status", {
    auth: "admin_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Duty toggled", () => {
    const json = pm.response.json();
    pm.expect(json.success).to.be.true;
    pm.expect(json.data).to.have.property("is_on_duty");
});`
  }),
  makeReq("Check Duty Status", "GET", "{{base_url}}/auth/check-duty", {
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Has duty info", () => {
    pm.expect(pm.response.json().success).to.be.true;
});`
  }),
  makeReq("❌ Login Invalid Credentials", "POST", "{{base_url}}/auth/login", {
    body: { username: "wronguser", password: "wrongpass" },
    tests: `
pm.test("Status 401", () => pm.response.to.have.status(401));
pm.test("Error message returned", () => {
    pm.expect(pm.response.json().success).to.be.false;
});`
  }),
]);

// ─── 01. Kategori ───────────────────────────────────────────
const f01 = folder("01. Kategori (Admin)", [
  makeReq("Create Kategori", "POST", "{{base_url}}/kategori", {
    auth: "admin_token",
    body: { nama: "Fiksi Test", deskripsi: "Kategori fiksi untuk testing" },
    tests: `
pm.test("Status 201", () => pm.response.to.have.status(201));
pm.test("Kategori created & ID saved", () => {
    const json = pm.response.json();
    pm.expect(json.success).to.be.true;
    pm.expect(json.data).to.have.property("id");
    pm.expect(json.data.nama).to.eql("Fiksi Test");
    pm.environment.set("created_kategori_id", json.data.id);
});`
  }),
  makeReq("Get All Kategori", "GET", "{{base_url}}/kategori", {
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Returns array", () => {
    pm.expect(pm.response.json().data).to.be.an("array");
});`
  }),
  makeReq("Get Kategori by ID", "GET", "{{base_url}}/kategori/{{created_kategori_id}}", {
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Returns correct kategori", () => {
    const d = pm.response.json().data;
    pm.expect(d.id).to.eql(parseInt(pm.environment.get("created_kategori_id")));
});`
  }),
  makeReq("Update Kategori", "PUT", "{{base_url}}/kategori/{{created_kategori_id}}", {
    auth: "admin_token",
    body: { nama: "Fiksi Updated", deskripsi: "Updated deskripsi" },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Kategori updated", () => {
    pm.expect(pm.response.json().success).to.be.true;
});`
  }),
  makeReq("❌ Create Duplicate Kategori", "POST", "{{base_url}}/kategori", {
    auth: "admin_token",
    body: { nama: "Fiksi Updated", deskripsi: "Duplikat" },
    tests: `
pm.test("Status 400", () => pm.response.to.have.status(400));
pm.test("Error for duplicate", () => {
    pm.expect(pm.response.json().success).to.be.false;
});`
  }),
  makeReq("❌ Get Kategori Not Found", "GET", "{{base_url}}/kategori/999999", {
    tests: `
pm.test("Status 404", () => pm.response.to.have.status(404));
pm.test("Not found message", () => {
    pm.expect(pm.response.json().success).to.be.false;
});`
  }),
]);

// ─── 02. Buku ───────────────────────────────────────────────
const f02 = folder("02. Buku (Admin)", [
  makeReq("Create Buku", "POST", "{{base_url}}/buku", {
    auth: "admin_token",
    body: { judul: "Buku Test Postman", pengarang: "Author Test", penerbit: "Publisher Test", tahun_terbit: 2024, isbn: "978-TEST-001", kategori_id: "{{created_kategori_id}}", stok: 5, kondisi: "baik", lokasi: "Rak A1", deskripsi: "Buku untuk testing Postman" },
    tests: `
pm.test("Status 201", () => pm.response.to.have.status(201));
pm.test("Buku created & ID saved", () => {
    const json = pm.response.json();
    pm.expect(json.success).to.be.true;
    pm.expect(json.data).to.have.property("id");
    pm.expect(json.data.judul).to.eql("Buku Test Postman");
    pm.environment.set("created_buku_id", json.data.id);
});`
  }),
  makeReq("Get All Buku", "GET", "{{base_url}}/buku", {
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Returns array", () => {
    const d = pm.response.json().data;
    pm.expect(d).to.be.an("array");
    pm.expect(d.length).to.be.greaterThan(0);
});`
  }),
  makeReq("Get Buku by ID", "GET", "{{base_url}}/buku/{{created_buku_id}}", {
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Correct buku returned", () => {
    const d = pm.response.json().data;
    pm.expect(d.judul).to.eql("Buku Test Postman");
    pm.expect(d).to.have.property("stok");
    pm.expect(d).to.have.property("kategori_id");
});`
  }),
  makeReq("Update Buku", "PUT", "{{base_url}}/buku/{{created_buku_id}}", {
    auth: "admin_token",
    body: { judul: "Buku Test Updated", pengarang: "Author Test", penerbit: "Publisher Test", tahun_terbit: 2024, isbn: "978-TEST-001", kategori_id: "{{created_kategori_id}}", stok: 10, kondisi: "baik", lokasi: "Rak B2", deskripsi: "Updated" },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Buku updated", () => {
    pm.expect(pm.response.json().success).to.be.true;
});`
  }),
  makeReq("❌ Create Buku Missing Fields", "POST", "{{base_url}}/buku", {
    auth: "admin_token",
    body: { judul: "" },
    tests: `
pm.test("Status 400", () => pm.response.to.have.status(400));
pm.test("Validation error", () => {
    pm.expect(pm.response.json().success).to.be.false;
});`
  }),
  makeReq("❌ Get Buku Not Found", "GET", "{{base_url}}/buku/999999", {
    tests: `
pm.test("Status 404", () => pm.response.to.have.status(404));`
  }),
]);

// ─── 03. User Management ───────────────────────────────────
const f03 = folder("03. User Management (Admin)", [
  makeReq("Create User", "POST", "{{base_url}}/user", {
    auth: "admin_token",
    body: { username: "testuser_pm", password: "test123456", nama_lengkap: "Test User Postman", nis: "PM001", role: "user", status: "active", email: "testpm@mail.com" },
    tests: `
pm.test("Status 201", () => pm.response.to.have.status(201));
pm.test("User created & ID saved", () => {
    const json = pm.response.json();
    pm.expect(json.success).to.be.true;
    pm.expect(json.data).to.have.property("id");
    pm.environment.set("created_user_id", json.data.id);
});`
  }),
  makeReq("Get All Users", "GET", "{{base_url}}/user", {
    auth: "admin_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Returns array of users", () => {
    pm.expect(pm.response.json().data).to.be.an("array");
});`
  }),
  makeReq("Get User by ID", "GET", "{{base_url}}/user/{{created_user_id}}", {
    auth: "admin_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Correct user returned", () => {
    const d = pm.response.json().data;
    pm.expect(d.username).to.eql("testuser_pm");
    pm.expect(d).to.not.have.property("password");
});`
  }),
  makeReq("Update User", "PUT", "{{base_url}}/user/{{created_user_id}}", {
    auth: "admin_token",
    body: { nama_lengkap: "Updated Postman User", phone: "081234567890" },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("User updated", () => {
    pm.expect(pm.response.json().success).to.be.true;
});`
  }),
  makeReq("❌ Create Duplicate Username", "POST", "{{base_url}}/user", {
    auth: "admin_token",
    body: { username: "testuser_pm", password: "test123456", nama_lengkap: "Dup", role: "user" },
    tests: `
pm.test("Status 400", () => pm.response.to.have.status(400));
pm.test("Duplicate error", () => {
    pm.expect(pm.response.json().success).to.be.false;
});`
  }),
  makeReq("Delete User", "DELETE", "{{base_url}}/user/{{created_user_id}}", {
    auth: "admin_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("User deleted", () => {
    pm.expect(pm.response.json().success).to.be.true;
});`
  }),
]);

// ─── 04. Settings ───────────────────────────────────────────
const f04 = folder("04. Settings (Admin)", [
  makeReq("Get Settings", "GET", "{{base_url}}/settings", {
    auth: "admin_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Settings has required fields", () => {
    const s = pm.response.json().data;
    pm.expect(s).to.have.property("max_borrow_limit");
    pm.expect(s).to.have.property("borrow_duration_days");
    pm.expect(s).to.have.property("denda_type");
    pm.expect(s).to.have.property("denda_per_day_amount");
    pm.expect(s).to.have.property("max_denda_amount");
});`
  }),
  makeReq("Update Settings", "PUT", "{{base_url}}/settings", {
    auth: "admin_token",
    body: { max_borrow_limit: 3, borrow_duration_days: 7, denda_type: "per_day", denda_per_day_amount: 1000 },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Settings updated", () => {
    pm.expect(pm.response.json().success).to.be.true;
});`
  }),
]);

// ─── 05. Flow: Peminjaman → Pengembalian (Happy Path) ──────
const f05 = folder("05. Flow: Peminjaman → Pengembalian (Happy Path)", [
  makeReq("[User] Request Peminjaman", "POST", "{{base_url}}/transaksi/request-peminjaman", {
    auth: "user_token",
    body: { buku_id: "{{created_buku_id}}" },
    tests: `
pm.test("Status 201", () => pm.response.to.have.status(201));
pm.test("Transaksi pending & ID saved", () => {
    const d = pm.response.json().data;
    pm.expect(d.status).to.eql("pending");
    pm.environment.set("transaksi_id_flow5", d.id);
});`
  }),
  makeReq("[Admin] Get All Transaksi (status=pending)", "GET", "{{base_url}}/transaksi?status=pending", {
    auth: "admin_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Has pending transaksi", () => {
    const d = pm.response.json().data;
    pm.expect(d).to.be.an("array");
    pm.expect(d.length).to.be.greaterThan(0);
});`
  }),
  makeReq("[Admin] Approve Peminjaman", "PUT", "{{base_url}}/transaksi/{{transaksi_id_flow5}}/approve-peminjaman", {
    auth: "admin_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Transaksi approved with dates", () => {
    const d = pm.response.json().data;
    pm.expect(d.status).to.eql("approved");
    pm.expect(d.tanggal_pinjam).to.not.be.null;
    pm.expect(d.tanggal_jatuh_tempo).to.not.be.null;
});`
  }),
  makeReq("[User] Get My Transaksi", "GET", "{{base_url}}/transaksi/user", {
    auth: "user_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Has approved transaksi", () => {
    const d = pm.response.json().data;
    pm.expect(d).to.be.an("array");
    const found = d.find(t => t.id === parseInt(pm.environment.get("transaksi_id_flow5")));
    pm.expect(found).to.not.be.undefined;
    pm.expect(found.status).to.eql("approved");
});`
  }),
  makeReq("[User] Request Pengembalian", "POST", "{{base_url}}/transaksi/request-pengembalian", {
    auth: "user_token",
    body: { transaksi_id: "{{transaksi_id_flow5}}" },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Return request sent", () => {
    pm.expect(pm.response.json().success).to.be.true;
});`
  }),
  makeReq("[Admin] Kalkulasi Denda (baik)", "POST", "{{base_url}}/transaksi/{{transaksi_id_flow5}}/kalkulasi-denda", {
    auth: "admin_token",
    body: { kondisi_buku: "baik", excluded_dates: [] },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Fine preview structure", () => {
    const k = pm.response.json().data;
    pm.expect(k).to.have.property("total_denda");
    pm.expect(k).to.have.property("denda_keterlambatan");
    pm.expect(k).to.have.property("denda_kerusakan");
    pm.expect(k).to.have.property("kondisi_buku");
    pm.expect(k.kondisi_buku).to.eql("baik");
    pm.expect(k.denda_kerusakan).to.eql(0);
});`
  }),
  makeReq("[Admin] Approve Pengembalian", "PUT", "{{base_url}}/transaksi/{{transaksi_id_flow5}}/approve-pengembalian", {
    auth: "admin_token",
    body: { kondisi_buku: "baik", excluded_dates: [] },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Pengembalian approved", () => {
    pm.expect(pm.response.json().success).to.be.true;
});`
  }),
  makeReq("[User] Verify Status = returned", "GET", "{{base_url}}/transaksi/{{transaksi_id_flow5}}", {
    auth: "user_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Transaksi returned", () => {
    pm.expect(pm.response.json().data.status).to.eql("returned");
});`
  }),
]);

// ─── 06. Flow: Peminjaman → Reject ─────────────────────────
const f06 = folder("06. Flow: Peminjaman → Reject", [
  makeReq("[User] Request Peminjaman", "POST", "{{base_url}}/transaksi/request-peminjaman", {
    auth: "user_token",
    body: { buku_id: "{{created_buku_id}}" },
    tests: `
pm.test("Status 201", () => pm.response.to.have.status(201));
pm.test("Save transaksi ID", () => {
    pm.environment.set("transaksi_id_flow6", pm.response.json().data.id);
});`
  }),
  makeReq("[Admin] Reject Peminjaman", "PUT", "{{base_url}}/transaksi/{{transaksi_id_flow6}}/reject-peminjaman", {
    auth: "admin_token",
    body: { rejection_reason: "Buku sudah dipesan oleh kelas lain" },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Rejection success", () => {
    pm.expect(pm.response.json().success).to.be.true;
    pm.expect(pm.response.json().message).to.include("ditolak");
});`
  }),
]);

// ─── 07. Flow: Perpanjangan ─────────────────────────────────
const f07 = folder("07. Flow: Perpanjangan", [
  makeReq("[User] Request Peminjaman (buku lain)", "POST", "{{base_url}}/transaksi/request-peminjaman", {
    auth: "user_token",
    body: { buku_id: "{{created_buku_id}}" },
    tests: `
pm.test("Status 201", () => pm.response.to.have.status(201));
pm.test("Save IDs", () => {
    pm.environment.set("transaksi_id_flow7", pm.response.json().data.id);
});`
  }),
  makeReq("[Admin] Approve Peminjaman", "PUT", "{{base_url}}/transaksi/{{transaksi_id_flow7}}/approve-peminjaman", {
    auth: "admin_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Approved", () => {
    pm.expect(pm.response.json().data.status).to.eql("approved");
});`
  }),
  makeReq("[User] Request Perpanjangan", "POST", "{{base_url}}/transaksi/{{transaksi_id_flow7}}/request-perpanjangan", {
    auth: "user_token",
    tests: `
pm.test("Status 201", () => pm.response.to.have.status(201));
pm.test("Extension request sent", () => {
    pm.expect(pm.response.json().success).to.be.true;
});`
  }),
  makeReq("[Admin] Approve Perpanjangan", "PUT", "{{base_url}}/transaksi/{{transaksi_id_flow7}}/approve-perpanjangan", {
    auth: "admin_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Extension approved with new date", () => {
    const d = pm.response.json().data;
    pm.expect(d).to.have.property("tanggal_jatuh_tempo_baru");
    pm.expect(d).to.have.property("extension_count");
    pm.expect(d.extension_count).to.be.greaterThan(0);
});`
  }),
  makeReq("[User] Verify Updated Due Date", "GET", "{{base_url}}/transaksi/{{transaksi_id_flow7}}", {
    auth: "user_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Extension count updated", () => {
    pm.expect(pm.response.json().data.extension_count).to.be.greaterThan(0);
});`
  }),
]);

// ─── 08. Flow: Pengembalian + Denda Rusak ───────────────────
const f08 = folder("08. Flow: Pengembalian + Denda (Buku Rusak)", [
  makeReq("[User] Req Pengembalian (from flow7)", "POST", "{{base_url}}/transaksi/request-pengembalian", {
    auth: "user_token",
    body: { transaksi_id: "{{transaksi_id_flow7}}" },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));`
  }),
  makeReq("[Admin] Kalkulasi Denda (rusak_ringan)", "POST", "{{base_url}}/transaksi/{{transaksi_id_flow7}}/kalkulasi-denda", {
    auth: "admin_token",
    body: { kondisi_buku: "rusak_ringan", excluded_dates: [] },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Denda kerusakan > 0", () => {
    const k = pm.response.json().data;
    pm.expect(k.denda_kerusakan).to.be.greaterThan(0);
    pm.expect(k.kondisi_buku).to.eql("rusak_ringan");
});`
  }),
  makeReq("[Admin] Bayar Denda (lunas)", "POST", "{{base_url}}/transaksi/{{transaksi_id_flow7}}/bayar-denda", {
    auth: "admin_token",
    body: { jumlah_bayar: 50000 },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Payment processed", () => {
    const d = pm.response.json().data;
    pm.expect(d).to.have.property("is_lunas");
    pm.expect(d).to.have.property("kembalian");
});`
  }),
  makeReq("[Admin] Approve Pengembalian", "PUT", "{{base_url}}/transaksi/{{transaksi_id_flow7}}/approve-pengembalian", {
    auth: "admin_token",
    body: { kondisi_buku: "rusak_ringan", excluded_dates: [] },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Returned", () => {
    pm.expect(pm.response.json().success).to.be.true;
});`
  }),
]);

// ─── 09. Flow: Denda Belum Lunas → Bulk Payment ────────────
// Reuses created_buku_id; previous flows should have returned it
const f09 = folder("09. Flow: Denda Belum Lunas → Bulk Payment", [
  makeReq("[User] Request Peminjaman", "POST", "{{base_url}}/transaksi/request-peminjaman", {
    auth: "user_token",
    body: { buku_id: "{{created_buku_id}}" },
    tests: `
pm.test("Status 201", () => pm.response.to.have.status(201));
pm.test("Save ID", () => { pm.environment.set("transaksi_id_flow9", pm.response.json().data.id); });`
  }),
  makeReq("[Admin] Approve Peminjaman", "PUT", "{{base_url}}/transaksi/{{transaksi_id_flow9}}/approve-peminjaman", {
    auth: "admin_token",
    tests: `
pm.test("Status 200 & approved", () => {
    pm.response.to.have.status(200);
    pm.expect(pm.response.json().data.status).to.eql("approved");
});`
  }),
  makeReq("[User] Request Pengembalian", "POST", "{{base_url}}/transaksi/request-pengembalian", {
    auth: "user_token",
    body: { transaksi_id: "{{transaksi_id_flow9}}" },
    tests: `pm.test("Status 200", () => pm.response.to.have.status(200));`
  }),
  makeReq("[Admin] Kalkulasi Denda (rusak_sedang)", "POST", "{{base_url}}/transaksi/{{transaksi_id_flow9}}/kalkulasi-denda", {
    auth: "admin_token",
    body: { kondisi_buku: "rusak_sedang", excluded_dates: [] },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Denda kerusakan sedang", () => {
    pm.expect(pm.response.json().data.denda_kerusakan).to.be.greaterThan(0);
});`
  }),
  makeReq("[Admin] Bayar Denda (kurang → sisa)", "POST", "{{base_url}}/transaksi/{{transaksi_id_flow9}}/bayar-denda", {
    auth: "admin_token",
    body: { jumlah_bayar: 1000 },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Partial payment, not lunas", () => {
    const d = pm.response.json().data;
    pm.expect(d.is_lunas).to.be.false;
});`
  }),
  makeReq("[Admin] Approve Pengembalian", "PUT", "{{base_url}}/transaksi/{{transaksi_id_flow9}}/approve-pengembalian", {
    auth: "admin_token",
    body: { kondisi_buku: "rusak_sedang", excluded_dates: [] },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));`
  }),
  makeReq("[Admin] Bulk Bayar Denda (lunasi sisa)", "POST", "{{base_url}}/transaksi/bulk-bayar-denda", {
    auth: "admin_token",
    prereq: `
const tid = pm.environment.get("transaksi_id_flow9");
const uid = pm.environment.get("user_id_for_flow");
pm.environment.set("_bulk_body", JSON.stringify({ transaksi_ids: [parseInt(tid)], jumlah_bayar: 100000, user_id: parseInt(uid) }));`,
    body: { transaksi_ids: [0], jumlah_bayar: 100000, user_id: 0 },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Bulk payment processed", () => {
    pm.expect(pm.response.json().success).to.be.true;
});`
  }),
]);

// ─── 10. Flow: Bulk Approve ─────────────────────────────────
const f10 = folder("10. Flow: Bulk Approve Peminjaman", [
  makeReq("[User] Request Peminjaman #1", "POST", "{{base_url}}/transaksi/request-peminjaman", {
    auth: "user_token",
    body: { buku_id: "{{created_buku_id}}" },
    tests: `
pm.test("Status 201", () => pm.response.to.have.status(201));
pm.test("Save bulk ID 1", () => {
    pm.environment.set("transaksi_ids_bulk", JSON.stringify([pm.response.json().data.id]));
});`
  }),
  makeReq("[Admin] Bulk Approve Peminjaman", "POST", "{{base_url}}/transaksi/bulk-approve-peminjaman", {
    auth: "admin_token",
    prereq: `
const ids = JSON.parse(pm.environment.get("transaksi_ids_bulk") || "[]");
pm.request.body.raw = JSON.stringify({ transaksi_ids: ids });`,
    body: { transaksi_ids: [] },
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Bulk approve result", () => {
    const d = pm.response.json().data;
    pm.expect(d).to.have.property("success");
    pm.expect(d).to.have.property("failed");
    pm.expect(d.success).to.be.an("array");
});`
  }),
]);

// ─── 12. Notifikasi ─────────────────────────────────────────
const f12 = folder("12. Notifikasi", [
  makeReq("[User] Get Unread Notifications", "GET", "{{base_url}}/notifikasi/unread", {
    auth: "user_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Has notifications array & count", () => {
    const json = pm.response.json();
    pm.expect(json).to.have.property("data");
    pm.expect(json).to.have.property("count");
    pm.expect(json.data).to.be.an("array");
    if (json.data.length > 0) {
        pm.environment.set("notification_id", json.data[0].id);
    }
});`
  }),
  makeReq("[User] Mark Notification as Read", "PUT", "{{base_url}}/notifikasi/{{notification_id}}/read", {
    auth: "user_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Marked as read", () => {
    pm.expect(pm.response.json().success).to.be.true;
});`
  }),
  makeReq("[User] Mark All as Read", "PUT", "{{base_url}}/notifikasi/read-all", {
    auth: "user_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("All marked as read", () => {
    pm.expect(pm.response.json().success).to.be.true;
});`
  }),
]);

// ─── 13. Edge Cases & Negative Tests ────────────────────────
const f13 = folder("13. Edge Cases & Negative Tests", [
  makeReq("❌ [Unauthorized] Access tanpa token", "GET", "{{base_url}}/transaksi", {
    tests: `
pm.test("Status 401", () => pm.response.to.have.status(401));
pm.test("Unauthorized message", () => {
    pm.expect(pm.response.json().message).to.include("Unauthorized");
});`
  }),
  makeReq("❌ [User] Access admin-only endpoint", "GET", "{{base_url}}/transaksi", {
    auth: "user_token",
    tests: `
pm.test("Status 403", () => pm.response.to.have.status(403));
pm.test("Forbidden", () => {
    pm.expect(pm.response.json().message).to.include("Forbidden");
});`
  }),
  makeReq("❌ [User] Pinjam buku stok 0 (if applicable)", "POST", "{{base_url}}/transaksi/request-peminjaman", {
    auth: "user_token",
    body: { buku_id: 999999 },
    tests: `
pm.test("Status 4xx error", () => {
    pm.expect(pm.response.code).to.be.oneOf([400, 404]);
});
pm.test("Error message", () => {
    pm.expect(pm.response.json().success).to.be.false;
});`
  }),
  makeReq("❌ [Admin] Approve non-existent transaksi", "PUT", "{{base_url}}/transaksi/999999/approve-peminjaman", {
    auth: "admin_token",
    tests: `
pm.test("Status 404", () => pm.response.to.have.status(404));
pm.test("Not found", () => {
    pm.expect(pm.response.json().success).to.be.false;
});`
  }),
  makeReq("❌ [Admin] Approve already rejected", "PUT", "{{base_url}}/transaksi/{{transaksi_id_flow6}}/approve-peminjaman", {
    auth: "admin_token",
    tests: `
pm.test("Status 400", () => pm.response.to.have.status(400));
pm.test("Cannot approve rejected", () => {
    pm.expect(pm.response.json().success).to.be.false;
});`
  }),
  makeReq("❌ [User] Request tanpa admin berjaga", "POST", "{{base_url}}/transaksi/request-peminjaman", {
    auth: "user_token",
    body: { buku_id: "{{created_buku_id}}" },
    prereq: `// NOTE: Run this AFTER toggling admin duty OFF in folder 14`,
    tests: `
pm.test("Status 400", () => pm.response.to.have.status(400));
pm.test("No admin on duty message", () => {
    pm.expect(pm.response.json().message).to.include("admin berjaga");
});`
  }),
]);

// ─── 14. Cleanup ────────────────────────────────────────────
const f14 = folder("14. Cleanup & Teardown", [
  makeReq("Toggle Duty Status (OFF)", "PUT", "{{base_url}}/auth/duty-status", {
    auth: "admin_token",
    tests: `
pm.test("Status 200", () => pm.response.to.have.status(200));`
  }),
  makeReq("Delete Test Kategori", "DELETE", "{{base_url}}/kategori/{{created_kategori_id}}", {
    auth: "admin_token",
    tests: `
pm.test("Cleanup done", () => {
    // May fail if books still exist — that's OK
    pm.expect(pm.response.code).to.be.oneOf([200, 400]);
});`
  }),
]);

// ─── Build Collection ───────────────────────────────────────
const collection = {
  info: {
    _postman_id: "perpustakaan-api-tests",
    name: "Perpustakaan API Tests",
    description: "Comprehensive API test collection for Perpustakaan Sekolah Digital. Run sequentially using Collection Runner.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  item: [f00, f01, f02, f03, f04, f05, f06, f07, f08, f09, f10, f12, f13, f14],
};

const outPath = path.join(__dirname, "Perpustakaan_API.postman_collection.json");
fs.writeFileSync(outPath, JSON.stringify(collection, null, 2), "utf-8");
console.log(`✅ Collection written to: ${outPath}`);
console.log(`   Total folders: ${collection.item.length}`);
console.log(`   Total requests: ${collection.item.reduce((s, f) => s + f.item.length, 0)}`);
