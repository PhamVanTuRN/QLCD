import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { fixtureTotp, nextFixtureTotp, waitForStableTotpWindow } from "../frontend/qlcd-web/tests/totp-fixture.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const useSql = process.argv.includes("--sql-local");
if (useSql && process.platform !== "win32") throw new Error("The SQL smoke uses Windows SQL Server Express.");
const sqlDatabase = `QLCD_Test_Auth_${randomBytes(12).toString("hex")}`;
const connection = `Server=lpc:.\\SQLEXPRESS;Database=${sqlDatabase};Integrated Security=True;Encrypt=True;TrustServerCertificate=True`;
const tempRoot = await realpath(tmpdir());
const storage = await mkdtemp(join(tempRoot, "qlcd-security-smoke-"));
const password = () => "Aa1!" + randomBytes(24).toString("hex");
const initialPassword = "123456aA@";
const adminUsername = "qlcd_admin";
const adminId = randomUUID();
const adminActivation = randomBytes(16).toString("hex");
const otherAdminActivation = randomBytes(16).toString("hex");
const adminPassword = password();
const departmentPassword = password();
const centralPassword = password();
const teamPassword = "Aa1!" + randomBytes(2).toString("hex");
const environment = useSql ? "Development" : "Testing";
const env = {
  ...process.env, DOTNET_ENVIRONMENT: environment, ASPNETCORE_ENVIRONMENT: environment,
  Data__UseInMemory: useSql ? "false" : "true", Bootstrap__OnDevelopmentStart: useSql ? "false" : "true",
  ...(useSql ? { ConnectionStrings__DefaultConnection: connection, ConnectionStrings__Migration: connection } : {}),
  Bootstrap__Username: adminUsername, Bootstrap__ActivationCode: adminActivation,
  Security__CredentialResetAccountId: adminId,
  Storage__Root: storage, Storage__MalwareScannerHost: ""
};
const dll = process.env.QLCD_TEST_API_DLL || join(root, "backend/QLCD.Api/bin/Debug/net10.0/QLCD.Api.dll");
const authPath = "/api/v1/auth";
const mfaPath = `${authPath}/authenticator`;
const finishPath = `${authPath}/login/authenticator`;
let child;
let testBlockId;
let logs = "";
try {
  if (useSql) {
    for (const operation of ["--migrate", "--initialize-data", "--bootstrap-admin"]) {
      const result = spawnSync("dotnet", [dll, operation], { cwd: root, env, windowsHide: true, timeout: 60000 });
      if (result.status !== 0) throw new Error(`SQL fixture ${operation} failed: ${result.stderr?.toString().slice(-1200) || result.error?.message}`);
    }
    const other = spawnSync("dotnet", [dll, "--bootstrap-admin"], { cwd: root, windowsHide: true, timeout: 60000,
      env: { ...env, Bootstrap__Username: "other_fixture_admin", Bootstrap__ActivationCode: otherAdminActivation } });
    if (other.status !== 0) throw new Error("Could not provision secondary fixture administrator.");
  }
  child = spawn("dotnet", [dll, "--urls", "http://127.0.0.1:0"], { cwd: root, env, windowsHide: true });
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  const origin = await waitForOrigin();
  const publicClient = session(origin);
  const admin = session(origin);
  assert.equal((await publicClient.request("/health/ready")).status, 200);
  assert.equal((await publicClient.request("/api/v1/accounts")).status, 401);
  const adminFactor = await onboard(admin, adminUsername, adminActivation, adminPassword, true);
  assert.equal((await admin.request("/api/v1/finance")).status, 403);
  const blockPage = await (await admin.request("/api/v1/management-blocks?activeOnly=true")).json();
  testBlockId = blockPage.data[0].id;
  assert.equal((await publicClient.request("/api/v1/management-blocks")).status, 401);
  await admin.write("/api/v1/union-units", { tenDonVi: "Missing group", loaiToChuc: "CDCS", maKhoi: null }, 400);
  const extraBlock = (await admin.json("/api/v1/management-blocks", { tenKhoi: "Khối phân nhóm HTTP", ghiChu: "Fixture", trangThai: true }, 200)).data;
  await admin.write(`/api/v1/management-blocks/${extraBlock}`, undefined, 405, "DELETE");
  await admin.write(`/api/v1/management-blocks/${extraBlock}`, { id: extraBlock, tenKhoi: "Khối phân nhóm HTTP", trangThai: false }, 409, "PUT");
  await admin.write(`/api/v1/management-blocks/${extraBlock}`, { id: extraBlock, tenKhoi: "Khối phân nhóm HTTP đổi tên", trangThai: false, confirmed: true }, 200, "PUT");
  await admin.write(`/api/v1/management-blocks/${extraBlock}`, { id: extraBlock, tenKhoi: "Khối phân nhóm HTTP đổi tên", trangThai: true }, 200, "PUT");

  const centralUnit = await admin.json("/api/v1/union-units", {
    tenDonVi: "Fixture central", loaiToChuc: "CDCS"
  }, 200);
  const departmentUnit = await admin.json("/api/v1/union-units", {
    tenDonVi: "Fixture department", loaiToChuc: "CDBP", maParent: centralUnit.data
  }, 200);
  const sourceTeam = await admin.json("/api/v1/union-units", {
    tenDonVi: "Fixture source team", loaiToChuc: "TO_CD_TRUC_THUOC_CDCS", maParent: centralUnit.data
  }, 200);
  const targetTeam = await admin.json("/api/v1/union-units", {
    tenDonVi: "Fixture target team", loaiToChuc: "TO_CD_TRUC_THUOC_CDCS", maParent: centralUnit.data
  }, 200);
  const accountResponse = await admin.request("/api/v1/accounts?page=1&pageSize=2");
  assert.equal(accountResponse.status, 200);
  const accountPage = await accountResponse.json();
  assert.equal(accountPage.canResetCredentials, true);
  assert.deepEqual(accountPage.credentialPolicy, {
    initialPassword, temporaryPasswordLifetimeHours: 24, activationCodeLifetimeHours: 24,
  });
  assert.equal(accountPage.data.length, 2);
  assert.equal(accountPage.hasMore, true);
  assert.ok(accountPage.data.every(account => account.organizationId !== departmentUnit.data));
  const searchedAccounts = await admin.request("/api/v1/accounts?pageSize=2&search=" + encodeURIComponent(" FIXTURE DEPARTMENT "));
  assert.equal(searchedAccounts.status, 200);
  const matchedAccounts = await searchedAccounts.json();
  assert.deepEqual(matchedAccounts.data.map(account => account.organizationId), [departmentUnit.data]);
  assert.equal(matchedAccounts.hasMore, false);
  const tooLong = await admin.request("/api/v1/accounts?search=" + "x".repeat(101));
  assert.equal(tooLong.status, 400);
  const allAccounts = await (await admin.request("/api/v1/accounts")).json();
  for (const account of allAccounts.data) {
    assert.equal(Object.hasOwn(account, "passwordRaw"), false);
    assert.equal(Object.hasOwn(account, "passwordHash"), false);
    assert.equal(Object.hasOwn(account, "protectedMfaSecret"), false);
    assert.equal(Object.hasOwn(account, "recoveryCodeHashes"), false);
  }
  const factors = new Map();
  const central = await provision("CDCS", centralPassword);
  const department = await provision("CDBP", departmentPassword);
  await department.write("/api/v1/management-blocks", { tenKhoi: "Forbidden" }, 403);
  await central.write(`/api/v1/management-blocks/${extraBlock}`, { id: extraBlock, tenKhoi: "Forbidden" }, 403, "PUT");
  await central.write("/api/v1/union-units", { tenDonVi: "No block", loaiToChuc: "CDBP", maParent: centralUnit.data, maKhoi: null }, 400);
  await central.write("/api/v1/union-units", { tenDonVi: "Invalid block", loaiToChuc: "CDBP", maParent: centralUnit.data, maKhoi: randomUUID() }, 409);

  const pdf = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n");
  const form = new FormData();
  form.append("file", new Blob([pdf], { type: "application/pdf" }), "fixture.pdf");
  const uploaded = await central.json("/api/v1/evidence-files/upload?moduleName=Activities&organizationId=" + centralUnit.data,
    form, 200);
  await central.json("/api/v1/activities", {
    tenHoatDong: "Fixture activity", donViId: centralUnit.data, loaiHoatDong: "PHONG_TRAO",
    tuNgay: "2026-01-22", denNgay: "2026-01-22", diaDiem: "Fixture", fileMinhChungUrl: uploaded.data.id
  }, 200);
  const url = uploaded.data.downloadUrl;
  const download = await central.request(url);
  assert.equal(download.status, 200);
  assert.match(download.headers.get("content-disposition"), /^attachment/);
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), pdf);
  assert.equal((await department.request(url)).status, 404);
  assert.equal((await publicClient.request(url)).status, 401);

  const memberPath = "/api/v1/union-members";
  const memberInput = {
    hoTen: "Fixture member", soCCCD: "000000007890", maNhanVien: "SMOKE7890",
    ngaySinh: "1990-01-01", ngayVaoCongDoan: "2024-01-01", gioiTinh: 1,
    maToCongDoan: sourceTeam.data, vaiTro: "DoanVien", loaiCanBo: "SiQuan"
  };
  const underage = await central.json(memberPath, { ...memberInput, ngaySinh: "2006-01-02" }, 400);
  assert.match(underage.message, /đủ 18 tuổi/);
  const future = await central.json(memberPath, { ...memberInput, ngayVaoCongDoan: "2100-01-01" }, 400);
  assert.match(future.message, /ngày hiện tại/);
  const notTeam = await central.json(memberPath, { ...memberInput, maToCongDoan: centralUnit.data }, 400);
  assert.match(notTeam.message, /tổ công đoàn/);
  assert.equal((await department.write(memberPath, memberInput, 403)).status, 403);

  const departmentTree = async () => (await (await department.request("/api/v1/union-units/tree")).json()).data;
  assert.equal((await departmentTree()).coTheTiepNhanDoanVien, true);
  const directInput = { ...memberInput, maToCongDoan: departmentUnit.data, soCCCD: "000000007892", maNhanVien: "SMOKE7892" };
  const directMember = await department.json(memberPath, directInput, 200);
  const directDetail = async () => (await (await department.request(`${memberPath}/${directMember.data}`)).json()).data;
  const admitted = await directDetail();
  assert.equal(admitted.maToCongDoan, departmentUnit.data);
  assert.equal(admitted.lichSuBienDong[0].loaiBienDong, "KetNapMoi");
  assert.equal((await departmentTree()).soDoanVien, 1);

  const childTeam = await admin.json("/api/v1/union-units", {
    tenDonVi: "Fixture department team", loaiToChuc: "TO_CD_THUOC_CDBP", maParent: departmentUnit.data
  }, 200);
  const newDirectInput = { ...directInput, soCCCD: "000000007893", maNhanVien: "SMOKE7893" };
  assert.equal((await departmentTree()).coTheTiepNhanDoanVien, false);
  assert.equal((await directDetail()).maToCongDoan, departmentUnit.data);
  assert.match((await department.json(memberPath, newDirectInput, 400)).message, /chưa có tổ/);
  await department.write(`${memberPath}/${directMember.data}/transfer`, {
    denToCongDoanId: childTeam.data, lyDo: "Fixture transfer from department", ngayHieuLuc: new Date().toISOString()
  }, 200);
  assert.equal((await directDetail()).maToCongDoan, childTeam.data);
  assert.equal((await departmentTree()).soDoanVien, 1);
  await admin.write(`/api/v1/union-units/${childTeam.data}`, undefined, 200, "DELETE");
  const treeWithInactiveTeam = await departmentTree();
  assert.deepEqual(treeWithInactiveTeam.children, []);
  assert.equal(treeWithInactiveTeam.coTheTiepNhanDoanVien, false);
  assert.match((await department.json(memberPath, newDirectInput, 400)).message, /chưa có tổ/);

  const member = await central.json(memberPath, memberInput, 200);
  const duplicate = await central.json(memberPath, { ...memberInput, soCCCD: "000000007891", maNhanVien: " SMOKE7890 " }, 409);
  assert.match(duplicate.message, /đã được sử dụng/);
  const duplicateIdentity = await central.json(memberPath, { ...memberInput, maNhanVien: "SMOKE7891" }, 409);
  assert.match(duplicateIdentity.message, /đã được sử dụng/);
  const transfer = {
    denToCongDoanId: targetTeam.data, lyDo: "Concurrent transfer fixture", ngayHieuLuc: new Date().toISOString()
  };
  const transfers = await Promise.all([central, central.copy()].map(client =>
    client.write(`/api/v1/union-members/${member.data}/transfer`, transfer, [200, 400, 409])));
  assert.equal(transfers.filter(response => response.ok).length, 1);
  const saved = await (await central.request(`/api/v1/union-members/${member.data}`)).json();
  assert.equal(saved.data.maToCongDoan, targetTeam.data);
  assert.equal(saved.data.lichSuBienDong.filter(event => event.loaiBienDong === "ChuyenSinhHoat").length, 1);

  const retained = central.copy();
  await central.write("/api/v1/auth/logout", undefined, 204);
  assert.equal((await retained.request("/api/v1/auth/session")).status, 401);
  assert.equal((await admin.request("/api/v1/union-members?pageSize=201")).status, 400);

  assert.equal((await publicClient.request(mfaPath)).status, 401);
  // Keep the longer block/lifecycle regression under the unchanged shared-IP quota.
  await delay(61_000);
  const mfaUser = await provision("TOCD", teamPassword);
  const mfaAccount = allAccounts.data.find(row => row.vaiTro === "TOCD");
  const teamFactor = factors.get("TOCD");
  const fresh = session(origin);
  const challenge = await beginLogin(fresh, mfaAccount.username, teamPassword);
  const modifiedChallenge = (challenge[0] === "C" ? "D" : "C") + challenge.slice(1);
  const rejectedChallenge = await fresh.json(finishPath, { challenge: modifiedChallenge, code: "000000" }, 401);
  assert.equal(rejectedChallenge.code, "mfa_challenge_expired");
  await fresh.write(finishPath, { challenge, code: fixtureTotp(teamFactor.key, -3) }, 401);
  const loginCode = (await nextFixtureTotp(teamFactor.key, teamFactor.step)).code;
  const signIns = await Promise.all([fresh, fresh.copy()].map(async client => ({
    client, response: await client.write(finishPath, { challenge, code: loginCode }, [200, 401]),
  })));
  assert.equal(signIns.filter(({ response }) => response.ok).length, 1);
  const authenticated = signIns.find(({ response }) => response.ok);
  const completed = await authenticated.response.json();
  assert.equal(completed.data.username, mfaAccount.username);
  assert.equal((await authenticated.client.request("/api/v1/auth/session")).status, 200);
  await fresh.write(finishPath, { challenge, code: loginCode }, 401);
  await fresh.write(finishPath, { challenge, code: loginCode }, 429);
  await authenticated.client.write(`${mfaPath}/disable`, {}, [404, 405]);

  const departmentAccount = allAccounts.data.find(row => row.vaiTro === "CDBP");
  const recovery = session(origin);
  const recoveryChallenge = await beginLogin(recovery, departmentAccount.username, departmentPassword);
  const oldRecoveryCode = factors.get("CDBP").codes[0];
  const { data: replacement } = await recovery.json(`${mfaPath}/recovery`, { challenge: recoveryChallenge, recoveryCode: oldRecoveryCode }, 200);
  assert.equal((await recovery.request(`${authPath}/session`)).status, 401);
  const replacementOtp = await nextFixtureTotp(replacement.key, -1);
  const { data: restored } = await recovery.json(`${mfaPath}/recovery/confirm`, { setup: replacement.setup, code: replacementOtp.code }, 200);
  assert.equal(restored.codes.length, 10);
  assert.ok(restored.codes.every(code => code !== oldRecoveryCode));
  assert.equal((await department.request(`${authPath}/session`)).status, 401);
  const currentChallenge = await beginLogin(recovery, departmentAccount.username, departmentPassword);
  await recovery.write(`${mfaPath}/recovery`, { challenge: currentChallenge, recoveryCode: oldRecoveryCode }, 400);
  const recoveredOtp = await nextFixtureTotp(replacement.key, replacementOtp.step);
  const wrongCode = String((Number(recoveredOtp.code) + 1) % 1000000).padStart(6, "0");
  await recovery.write(finishPath, { challenge: currentChallenge, code: wrongCode }, 401);
  await recovery.write(finishPath, { challenge: currentChallenge, code: recoveredOtp.code }, 200);

  const resetPath = `/api/v1/accounts/${mfaAccount.id}/reset-2fa`;
  const centralAccount = allAccounts.data.find(row => row.vaiTro === "CDCS");
  const resetPasswordPath = `/api/v1/accounts/${centralAccount.id}/reset-password`;
  const resetBody = { identityVerified: true, confirmed: true, currentPassword: adminPassword };
  await admin.write(resetPath, resetBody, 400);
  await admin.write(resetPasswordPath, resetBody, 400);
  const adminOtp = await nextFixtureTotp(adminFactor.key, adminFactor.step);
  await admin.write(resetPath, { ...resetBody, identityVerified: false, code: adminOtp.code }, 400);
  await admin.write(`/api/v1/accounts/${adminId}/reset-password`, { ...resetBody, code: adminOtp.code }, 403);
  await mfaUser.write(resetPasswordPath, { ...resetBody, code: adminOtp.code }, 403);
  const { data: reset } = await admin.json(resetPath, { ...resetBody, code: adminOtp.code }, 200);
  assert.match(reset.activationCode, /^[A-F0-9]{32}$/);
  assert.equal((await mfaUser.request(`${authPath}/session`)).status, 401);
  const restricted = await fresh.json(`${authPath}/login`, { username: mfaAccount.username, password: teamPassword }, 200);
  assert.equal(restricted.data.needsAuthenticator, true);
  assert.equal(restricted.data.mustChangePassword, false);
  assert.equal(restricted.data.hasRecoveryCodes, false);
  assert.equal((await fresh.request(`/api/v1/union-members`)).status, 403);
  await fresh.write(`${mfaPath}/setup`, { currentPassword: teamPassword }, 400);
  await fresh.write(`${mfaPath}/setup`, { currentPassword: teamPassword, activationCode: reset.activationCode }, 200);

  const centralFactor = factors.get("CDCS");
  const beforePasswordReset = session(origin);
  const oldCentralChallenge = await beginLogin(beforePasswordReset, centralAccount.username, centralPassword);
  const oldCentralOtp = await nextFixtureTotp(centralFactor.key, centralFactor.step);
  await beforePasswordReset.write(finishPath, { challenge: oldCentralChallenge, code: oldCentralOtp.code }, 200);
  await admin.write(resetPasswordPath, { ...resetBody, code: adminOtp.code }, 403);
  assert.equal((await beforePasswordReset.request(`${authPath}/session`)).status, 200);
  const nextAdminOtp = await nextFixtureTotp(adminFactor.key, adminOtp.step);
  await admin.write(resetPasswordPath, { ...resetBody, code: nextAdminOtp.code }, 204);
  assert.equal((await beforePasswordReset.request(`${authPath}/session`)).status, 401);
  const passwordResetChallenge = await beginLogin(beforePasswordReset, centralAccount.username, initialPassword);
  const passwordResetOtp = await nextFixtureTotp(centralFactor.key, oldCentralOtp.step);
  const afterPasswordReset = await beforePasswordReset.json(finishPath, { challenge: passwordResetChallenge, code: passwordResetOtp.code }, 200);
  assert.equal(afterPasswordReset.data.mustChangePassword, true);
  assert.equal(afterPasswordReset.data.needsAuthenticator, false);
  assert.equal(afterPasswordReset.data.hasRecoveryCodes, true);
  assert.equal((await beforePasswordReset.request("/api/v1/union-members")).status, 403);

  if (useSql) {
    // The additional SQL administrator flow needs its own window under the shared per-IP quota.
    await delay(61_000);
    const otherAdmin = session(origin);
    const otherPassword = password();
    const otherFactor = await onboard(otherAdmin, "other_fixture_admin", otherAdminActivation, otherPassword);
    const grantsResponse = await otherAdmin.request("/api/v1/accounts");
    assert.equal(grantsResponse.status, 200);
    const grants = await grantsResponse.json();
    assert.equal(grants.canResetCredentials, false);
    const code = (await nextFixtureTotp(otherFactor.key, otherFactor.step)).code;
    await otherAdmin.write(resetPath, { ...resetBody, currentPassword: otherPassword, code }, 403);
    await otherAdmin.write(resetPasswordPath, { ...resetBody, currentPassword: otherPassword, code }, 403);
    const audit = spawnSync("sqlcmd", ["-S", "lpc:.\\SQLEXPRESS", "-E", "-C", "-b", "-d", sqlDatabase, "-Q", `
      IF (SELECT COUNT(*) FROM dbo.AuditLogs WHERE UserId = N'${adminId}' AND
        ((RecordId = '${centralAccount.id}' AND Action = N'AUTH_PASSWORD_RESET') OR
        (RecordId = '${mfaAccount.id}' AND Action = N'AUTH_MFA_RESET')) AND OldValues IS NULL AND NewValues IS NULL) <> 2
        THROW 51000, 'Credential reset audit missing or contains credential details', 1;
    `], { windowsHide: true, timeout: 30000 });
    assert.equal(audit.status, 0, audit.stderr?.toString());
  }
  // Additional onboarding and lifecycle checks use a fresh shared-IP quota window.
  await delay(61_000);
  const lifecycleUnit = (await admin.json("/api/v1/union-units", {
    tenDonVi: "Lifecycle leaf", loaiToChuc: "CDBP", maParent: centralUnit.data
  }, 200)).data;
  const lifecycleAccount = (await (await admin.request("/api/v1/accounts?search=Lifecycle")).json()).data[0];
  const lifecycleActivation = (await admin.json(`/api/v1/accounts/${lifecycleAccount.id}/activate`, { identityVerified: true }, 200)).data.activationCode;
  const lifecyclePassword = password();
  const lifecycleClient = session(origin);
  await onboard(lifecycleClient, lifecycleAccount.username, lifecycleActivation, lifecyclePassword);
  const oldSession = lifecycleClient.copy();
  await lifecycleClient.write(`/api/v1/union-units/${lifecycleUnit}`, undefined, 403, "DELETE");
  await admin.write(`/api/v1/union-units/${centralUnit.data}`, undefined, 409, "DELETE");
  await admin.write(`/api/v1/union-units/${departmentUnit.data}`, undefined, 409, "DELETE");
  await admin.write(`/api/v1/union-units/${lifecycleUnit}`, undefined, 200, "DELETE");
  const inactiveTree = (await (await admin.request("/api/v1/union-units/tree")).json()).data;
  assert.ok(!inactiveTree.children.some(u => u.id === lifecycleUnit));
  let lifecycleRow = (await (await admin.request("/api/v1/accounts?search=Lifecycle")).json()).data[0];
  assert.equal(lifecycleRow.id, lifecycleAccount.id);
  assert.equal(lifecycleRow.organizationId, lifecycleUnit);
  assert.equal(lifecycleRow.organizationActive, false);
  assert.equal(lifecycleRow.canSignIn, false);
  assert.equal(lifecycleRow.trangThai, true); // Own lock flag remains independent.
  assert.equal((await oldSession.request(`${authPath}/session`)).status, 401);
  assert.equal((await oldSession.request(memberPath)).status, 401);
  await session(origin).write(`${authPath}/login`, { username: lifecycleAccount.username, password: lifecyclePassword }, 401);
  await admin.write(`/api/v1/accounts/${lifecycleAccount.id}/toggle`, undefined, 200);
  await admin.write(`/api/v1/accounts/${lifecycleAccount.id}/toggle`, undefined, 409);
  const unlockOtp = await nextFixtureTotp(adminFactor.key, nextAdminOtp.step);
  const unlockBody = { confirmed: true, currentPassword: adminPassword, code: unlockOtp.code };
  const unlockPath = `/api/v1/accounts/${lifecycleAccount.id}/unlock`;
  await admin.write(unlockPath, { ...unlockBody, confirmed: false }, 400);
  await admin.write(unlockPath, { ...unlockBody, currentPassword: "WrongPassword1!" }, 403);
  const rejectedUnlock = (await (await admin.request("/api/v1/accounts?search=Lifecycle")).json()).data[0];
  assert.equal(rejectedUnlock.trangThai, false); assert.equal(rejectedUnlock.organizationActive, false);
  const verifiedUnlock = (await admin.json(unlockPath, unlockBody, 200)).data;
  assert.equal(verifiedUnlock.organizationRestored, true); assert.equal(verifiedUnlock.organizationId, lifecycleUnit);
  await admin.write(unlockPath, unlockBody, 403); // Consumed OTP cannot be replayed.

  lifecycleRow = (await (await admin.request("/api/v1/accounts?search=Lifecycle")).json()).data[0];
  assert.equal(lifecycleRow.trangThai, true);
  assert.equal(lifecycleRow.organizationActive, true);
  assert.equal(lifecycleRow.canSignIn, true);
  const unlockedTree = (await (await admin.request("/api/v1/union-units/tree")).json()).data;
  assert.ok(unlockedTree.children.some(u => u.id === lifecycleUnit));
  assert.equal((await oldSession.request(`${authPath}/session`)).status, 401);
  await admin.write(`/api/v1/union-units/${lifecycleUnit}`, undefined, 200, "DELETE");
  const archived = (await (await admin.request("/api/v1/union-units/inactive")).json()).data;
  assert.ok(archived.some(u => u.id === lifecycleUnit));
  await admin.write(`/api/v1/accounts/${lifecycleAccount.id}/toggle`, undefined, 200); // Lock explicitly before restore.
  await admin.write(`/api/v1/union-units/${lifecycleUnit}/restore`, undefined, 200);
  lifecycleRow = (await (await admin.request("/api/v1/accounts?search=Lifecycle")).json()).data[0];
  assert.equal(lifecycleRow.organizationActive, true);
  assert.equal(lifecycleRow.trangThai, false);
  assert.equal(lifecycleRow.canSignIn, false);
  assert.equal((await oldSession.request(`${authPath}/session`)).status, 401);

  console.log(`Security smoke passed (${useSql ? "isolated SQL Server Express database" : "InMemory"}, synthetic accounts and files).`);

  async function provision(role, permanentPassword) {
    const account = allAccounts.data.find(row => row.vaiTro === role);
    assert.ok(account);
    const client = session(origin);
    if (role === "CDCS")
      await client.write(`${authPath}/login`, { username: account.username, password: initialPassword }, 401);
    const { data } = await admin.json(`/api/v1/accounts/${account.id}/activate`, { identityVerified: true }, 200);
    factors.set(role, await onboard(client, account.username, data.activationCode, permanentPassword));
    return client;
  }

  async function beginLogin(client, username, credential) {
    const result = await client.json(`${authPath}/login`, { username, password: credential }, 202);
    assert.equal(Object.hasOwn(result.data, "username"), false);
    assert.equal((await client.request(`${authPath}/session`)).status, 401);
    return result.data.challenge;
  }

  async function onboard(client, username, activationCode, permanentPassword, checkRestrictions = false) {
    const opened = await client.json(`${authPath}/login`, { username, password: initialPassword }, 200);
    assert.equal(opened.data.mustChangePassword, true);
    assert.equal(opened.data.needsAuthenticator, true);
    assert.equal(opened.data.organizationId, null);
    assert.equal(opened.data.hoTen, username);
    assert.equal(Object.hasOwn(opened.data, "token"), false);
    assert.equal((await client.request("/api/v1/union-members")).status, 403);
    if (checkRestrictions)
      await client.write(`${mfaPath}/setup`, { currentPassword: initialPassword }, 400);
    const delivered = await client.write(`${mfaPath}/setup`, { currentPassword: initialPassword, activationCode }, 200);
    assert.equal(delivered.headers.get("cache-control"), "no-store");
    const { data: setup } = await delivered.json();
    assert.match(setup.key, /^[A-Z2-7]{32}$/);
    assert.match(setup.qrImage, /^data:image\/png;base64,iVBORw0KGgo/);
    if (checkRestrictions) {
      const abandoned = session(origin);
      await abandoned.json(`${authPath}/login`, { username, password: initialPassword }, 200);
      await abandoned.write(`${mfaPath}/confirm`, { setup: setup.setup, code: fixtureTotp(setup.key) }, 400);
      assert.equal((await abandoned.request("/api/v1/union-members")).status, 403);
    }
    await waitForStableTotpWindow();
    const otp = await nextFixtureTotp(setup.key, -1);
    const { data: recovery } = await client.json(`${mfaPath}/confirm`, { setup: setup.setup, code: otp.code }, 200);
    assert.equal(recovery.codes.length, 10);
    assert.equal((await client.request("/api/v1/union-members")).status, 403);
    const passwordChange = { currentPassword: initialPassword, newPassword: permanentPassword, confirmPassword: permanentPassword };
    if (checkRestrictions) await client.write(`${authPath}/change-password`, passwordChange, 400);
    const modified = await nextFixtureTotp(setup.key, otp.step);
    if (username === adminUsername) {
      await client.write(`${authPath}/change-password`, { ...passwordChange, newPassword: initialPassword, confirmPassword: initialPassword, code: modified.code }, 400);
      await client.write(`${authPath}/change-password`, { ...passwordChange, newPassword: "Abcdef12", confirmPassword: "Abcdef12", code: modified.code }, 400);
    }
    const retained = client.copy();
    await client.write(`${authPath}/change-password`, { ...passwordChange, code: modified.code }, 204);
    assert.equal((await retained.request(`${authPath}/session`)).status, 401);
    const challenge = await beginLogin(client, username, permanentPassword);
    const factor = await nextFixtureTotp(setup.key, modified.step);
    await client.write(finishPath, { challenge, code: factor.code }, 200);
    return { key: setup.key, step: factor.step, codes: recovery.codes };
  }
} catch (error) {
  console.error(logs.slice(-14000));
  throw error;
} finally {
  if (child?.exitCode === null) {
    child.kill();
    await once(child, "exit");
  }
  const resolvedStorage = await realpath(storage);
  if (dirname(resolvedStorage) === tempRoot && basename(resolvedStorage).startsWith("qlcd-security-smoke-"))
    await rm(resolvedStorage, { recursive: true, force: true });
  if (useSql) {
    const result = spawnSync("sqlcmd", ["-S", "lpc:.\\SQLEXPRESS", "-E", "-C", "-b", "-d", "master", "-Q",
      `IF DB_ID(N'${sqlDatabase}') IS NOT NULL BEGIN ALTER DATABASE [${sqlDatabase}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${sqlDatabase}]; END;`
    ], { windowsHide: true, timeout: 30000 });
    if (result.status !== 0) throw new Error(`Unable to remove the SQL fixture ${sqlDatabase}.`);
  }
}

async function waitForOrigin() {
  for (let i = 0; i < 120; i++) {
    const bound = logs.match(/Now listening on: (http:\/\/127\.0\.0\.1:\d+)/);
    if (bound) return bound[1];
    if (child.exitCode !== null) throw new Error("Smoke API stopped before startup");
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("Smoke API did not start");
}

function session(origin, initialCookies = []) {
  const cookies = new Map(initialCookies);
  const request = async (path, init = {}) => {
    const headers = new Headers(init.headers);
    headers.set("Cookie", [...cookies].map(parts => parts.join("=")).join("; "));
    const response = await fetch(origin + path, { ...init, headers, signal: AbortSignal.timeout(15_000) });
    for (const value of response.headers.getSetCookie()) {
      const pair = value.split(";", 1)[0];
      const separator = pair.indexOf("=");
      const name = pair.slice(0, separator);
      if (pair.length === separator + 1) cookies.delete(name);
      else cookies.set(name, pair.slice(separator + 1));
    }
    return response;
  };
  const write = async (path, data, expected, method = "POST") => {
    if (path === "/api/v1/union-units" && data && data.maKhoi === undefined) data = { ...data, maKhoi: testBlockId };
    const csrf = await request("/api/v1/auth/csrf");
    assert.equal(csrf.status, 200);
    const headers = { "X-CSRF-Token": (await csrf.json()).token };
    if (data !== undefined && !(data instanceof FormData)) headers["Content-Type"] = "application/json";
    const response = await request(path, { method, headers,
      body: data instanceof FormData ? data : JSON.stringify(data) });
    assert.ok([expected].flat().includes(response.status), "Unexpected status " + response.status + " for " + path);
    return response;
  };
  return { request, write, json: async (...args) => (await write(...args)).json(),
    copy: () => session(origin, cookies) };
}
