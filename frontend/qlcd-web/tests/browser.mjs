import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer, request } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import { currentTotpStep, fixtureTotpAt, nextFixtureTotp } from "./totp-fixture.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const frontend = fileURLToPath(new URL("../", import.meta.url));
const baseline = process.argv.includes("--baseline");
const output = resolve(process.env.QLCD_BROWSER_ARTIFACTS || join(root, "artifacts/browser"), baseline ? "before" : "after");
const storage = await mkdtemp(join(tmpdir(), "qlcd-browser-"));
const children = [];
const password = () => "Aa1!" + randomBytes(24).toString("hex");
const adminUsername = baseline ? "browser-admin" : "qlcd_admin";
const initialPassword = baseline ? password() : "123456aA@";
const adminActivation = randomBytes(16).toString("hex");
const adminPassword = password();
const centralPassword = password();
const widths = [360, 390, 768, 1024, 1280, 1440, 1920];
const report = { screens: [], accessibility: [], browserErrors: [], apiFailures: [], dashboard: [], flows: [] };
let browser;
let ingress;
let page;

try {
  await mkdir(output, { recursive: true });
  const api = await start("dotnet", [process.env.QLCD_TEST_API_DLL || join(root, "backend/QLCD.Api/bin/Debug/net10.0/QLCD.Api.dll"),
    "--urls", "http://127.0.0.1:0"], root, {
    ASPNETCORE_ENVIRONMENT: "Testing", DOTNET_ENVIRONMENT: "Testing", Data__UseInMemory: "true",
    Bootstrap__OnDevelopmentStart: "true", Bootstrap__Username: adminUsername,
    Security__CredentialResetAccountId: randomUUID(),
    Bootstrap__Password: initialPassword, Bootstrap__ActivationCode: adminActivation, Storage__Root: storage, Storage__MalwareScannerHost: "",
  }, /Now listening on: (http:\/\/127\.0\.0\.1:\d+)/);
  const webPort = await availablePort();
  const web = `http://127.0.0.1:${webPort}`;
  await start(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(webPort)],
    frontend, { NEXT_TELEMETRY_DISABLED: "1" }, /Ready in/);
  ingress = createServer((incoming, outgoing) => {
    const upstream = new URL(incoming.url, incoming.url.startsWith("/api/v1/") ? api : web);
    const proxy = request(upstream, { method: incoming.method, headers: incoming.headers }, response => {
      outgoing.writeHead(response.statusCode, response.headers);
      response.pipe(outgoing);
    });
    proxy.on("error", () => {
      if (!outgoing.headersSent) outgoing.writeHead(502);
      outgoing.end();
    });
    incoming.pipe(proxy);
  });
  const origin = `http://127.0.0.1:${await listen(ingress)}`;
  browser = await chromium.launch({
    executablePath: process.env.QLCD_CHROMIUM_PATH ||
      (process.platform === "win32" && existsSync("C:/Program Files/Google/Chrome/Application/chrome.exe")
        ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined),
  });
  const context = await browser.newContext({ baseURL: origin, reducedMotion: "reduce" });
  page = await context.newPage();
  page.setDefaultTimeout(12_000);
  page.on("pageerror", error => report.browserErrors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource:"))
      report.browserErrors.push(message.text());
  });
  page.on("response", response => {
    if (response.status() >= 400 && response.url().includes("/api/v1/")
      && !(response.status() === 401 && response.url().endsWith("/auth/session")))
      report.apiFailures.push(`${response.request().method()} ${new URL(response.url()).pathname} ${response.status()}`);
  });

  await page.goto("/login");
  await page.getByRole("button", { name: "Đăng nhập" }).waitFor();
  const firstApiWindow = Date.now();
  await capture("/login");
  if (baseline) {
    await signIn(adminUsername, initialPassword);
    await changePassword(initialPassword, adminPassword);
    await signIn(adminUsername, adminPassword);
  } else {
    await enroll(adminUsername, adminActivation, adminPassword);
    report.flows.push("Administrator completes mandatory activation, QR enrollment and OTP-gated password change");
  }
  await page.waitForURL(origin + "/");

  if (!baseline) {
    await open("/members");
    await page.getByRole("button", { name: /Thêm Đoàn viên mới/ }).click();
    const add = page.getByRole("dialog", { name: "Thêm đoàn viên" });
    await add.getByText("Chưa có đơn vị đủ điều kiện tiếp nhận đoàn viên trong phạm vi tài khoản.").waitFor();
    await add.getByRole("link", { name: "Mở Cây tổ chức" }).click();
    await page.waitForURL("**/organizations");
    await page.getByRole("button", { name: "Tạo Công đoàn cơ sở" }).waitFor();
    report.flows.push("Member intake explains prerequisites on a fresh database");
  }
  const centralName = "Công đoàn Cơ sở thử nghiệm";
  const directTeamName = "Tổ thử nghiệm";
  const emptyDepartmentName = "CĐBP chưa có tổ thử nghiệm";
  let team, targetTeam, emptyDepartmentId;
  if (baseline) {
    const central = await post("/union-units", { tenDonVi: centralName, loaiToChuc: "CDCS" });
    team = await post("/union-units", { tenDonVi: directTeamName, loaiToChuc: "TO_CD_TRUC_THUOC_CDCS", maParent: central });
  } else {
    const departmentName = "CĐBP Khoa thử nghiệm";
    async function createUnit(button, name) {
      await page.getByRole("button", { name: button, exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Thêm đơn vị" });
      await dialog.getByLabel("Tên đơn vị *", { exact: true }).fill(name);
      await dialog.getByRole("button", { name: "Xác nhận tạo" }).click();
      await page.getByRole("button", { name, exact: true }).waitFor();
    }
    await createUnit("Tạo Công đoàn cơ sở", centralName);
    await createUnit("Thêm Công đoàn Bộ phận", emptyDepartmentName);
    await page.getByRole("button", { name: emptyDepartmentName, exact: true }).click();
    await page.getByText("Chưa có tổ công đoàn", { exact: true }).waitFor();
    await page.getByRole("button", { name: centralName, exact: true }).click();
    await createUnit("Thêm Công đoàn Bộ phận", departmentName);
    await createUnit("Thêm tổ trực thuộc CĐCS", directTeamName);
    await page.getByRole("button", { name: departmentName, exact: true }).click();
    await createUnit("Thêm tổ thuộc CĐBP", "Tổ đích thử nghiệm");

    const response = await context.request.get("/api/v1/union-units/tree");
    assert.equal(response.status(), 200);
    const tree = (await response.json()).data;
    const directTeam = tree.children.find(unit => unit.tenDonVi === directTeamName);
    const department = tree.children.find(unit => unit.tenDonVi === departmentName);
    const emptyDepartment = tree.children.find(unit => unit.tenDonVi === emptyDepartmentName);
    const departmentTeam = department.children.find(unit => unit.tenDonVi === "Tổ đích thử nghiệm");
    assert.equal(directTeam.loaiToChuc, "TO_CD_TRUC_THUOC_CDCS");
    assert.equal(departmentTeam.loaiToChuc, "TO_CD_THUOC_CDBP");
    assert.deepEqual(emptyDepartment.children, []);
    emptyDepartmentId = emptyDepartment.id;
    team = directTeam.id;
    targetTeam = departmentTeam.id;
    report.flows.push("Create an empty department and teams at both levels");
  }
  const member = await post("/union-members", {
    hoTen: "Đoàn viên thử nghiệm", ngaySinh: "1990-01-01", gioiTinh: 0, soCCCD: "000000000123",
    maNhanVien: "FIXTURE01", loaiCanBo: "SiQuan", maToCongDoan: team, ngayVaoCongDoan: "2025-01-01", vaiTro: "DoanVien",
  });
  const accountList = await context.request.get("/api/v1/accounts");
  assert.equal(accountList.status(), 200);
  const accounts = (await accountList.json()).data;
  const account = accounts.find(row => row.vaiTro === "CDCS");
  const temporaryPassword = password();
  let centralActivation;
  if (baseline) {
    await post(`/accounts/${account.id}/reset-password`, { newPassword: temporaryPassword }, 204);
    await post(`/accounts/${account.id}/toggle`);
  } else {
    centralActivation = (await post(`/accounts/${account.id}/activate`, { identityVerified: true })).activationCode;
  }
  const departmentAccount = accounts.find(row => row.organizationId === emptyDepartmentId && row.vaiTro === "CDBP");
  const departmentPassword = password();
  let departmentActivation;
  if (!baseline) {
    assert.ok(departmentAccount);
  }

  for (const route of ["/accounts", "/organizations", "/members", `/members/${member}`]) {
    await open(route);
    await capture(route);
  }
  if (!baseline) {
    await open("/accounts");
    const accountSearch = page.getByRole("textbox", { name: "Tìm kiếm", exact: true });
    const accountsTable = page.getByRole("region", { name: "Bảng tài khoản" });
    await accountsTable.getByText(departmentAccount.username, { exact: true }).waitFor();
    const searchRequest = page.waitForResponse(response => {
      const url = new URL(response.url());
      return url.pathname === "/api/v1/accounts" && url.searchParams.get("search") === "CHƯA CÓ TỔ";
    });
    await accountSearch.fill("  CHƯA CÓ TỔ  ");
    const searched = await searchRequest;
    assert.equal(searched.status(), 200);
    assert.deepEqual((await searched.json()).data.map(row => row.username), [departmentAccount.username]);
    await accountsTable.getByText(adminUsername, { exact: true }).waitFor({ state: "hidden" });
    await accountSearch.fill("");
    await accountsTable.getByText(adminUsername, { exact: true }).waitFor();
    report.flows.push("Account search uses organization matching on the API and clears to the full list");
    const departmentRow = accountsTable.getByRole("row").filter({ hasText: departmentAccount.username });
    const ownRow = accountsTable.getByRole("row").filter({ hasText: adminUsername });
    assert.equal(await ownRow.getByRole("button", { name: /^Reset/ }).count(), 0);
    for (const action of ["Reset mật khẩu", "Reset 2FA"]) {
      await departmentRow.getByRole("button", { name: action, exact: true }).click();
      const confirmation = page.getByRole("dialog", { name: action });
      await confirmation.getByRole("checkbox").waitFor();
      await confirmation.getByLabel("Mã Authenticator", { exact: true }).waitFor();
      await page.keyboard.press("Escape");
      await confirmation.waitFor({ state: "hidden" });
    }
    report.flows.push("Configured administrator sees independent reset dialogs with OTP and confirmation only for other accounts");
    await departmentRow.getByRole("button", { name: "Cấp mã kích hoạt" }).click();
    const activationDialog = page.getByRole("dialog", { name: "Cấp mã kích hoạt" });
    await activationDialog.getByRole("checkbox").check();
    await activationDialog.getByRole("button", { name: "Xác nhận cấp mã" }).click();
    await activationDialog.locator("code").waitFor();
    departmentActivation = await activationDialog.locator("code").textContent();
    await activationDialog.getByRole("button", { name: "Đã lưu mã" }).click();
    report.flows.push("Administrator delivers a one-time activation code after verifying identity");

    await open("/catalogs");
    await page.getByRole("button", { name: /Thêm Danh mục/ }).click();
    const catalog = page.getByRole("dialog", { name: "Thông tin danh mục" });
    await catalog.getByLabel(/Mã danh mục/).fill("FIXTURE_CATALOG");
    await catalog.getByLabel(/Tên hiển thị/).fill("Danh mục qua giao diện");
    await catalog.getByRole("button", { name: /Lưu/ }).click();
    const row = page.getByRole("row").filter({ hasText: "FIXTURE_CATALOG" });
    await row.getByRole("button", { name: "Sửa", exact: true }).click();
    await catalog.getByLabel(/Tên hiển thị/).fill("Danh mục đã cập nhật");
    await catalog.getByRole("button", { name: /Lưu/ }).click();
    await row.getByText("Danh mục đã cập nhật").waitFor();
    report.flows.push("Create and edit reference catalog");
    await open("/finance");
    await page.getByRole("heading", { name: "Bạn chưa có quyền mở trang này" }).waitFor();
    report.flows.push("Admin finance access screen");
  }
  await post("/auth/logout", undefined, 204);
  await page.goto("/login");
  if (baseline) {
    await signIn(account.username, temporaryPassword);
    await changePassword(temporaryPassword, centralPassword);
    await signIn(account.username, centralPassword);
  } else await enroll(account.username, centralActivation, centralPassword);
  await page.waitForURL(origin + "/");
  for (const route of ["/", "/quality", "/activities", "/finance", "/welfare", "/initiatives", "/emulations", "/catalogs"]) {
    await open(route);
    await capture(route);
  }

  for (let round = 0; round < 3; round++) {
    const profile = await context.storageState();
    const measurement = await browser.newContext({ baseURL: origin, storageState: profile, viewport: { width: 1440, height: 960 } });
    try {
      const dashboard = await measurement.newPage();
      const stats = dashboard.waitForResponse(response => response.url().endsWith("/api/v1/union-units/stats") && response.ok());
      await dashboard.goto("/");
      await stats;
      await dashboard.getByText(baseline ? "Tổng Đoàn viên" : "Đoàn viên đang sinh hoạt", { exact: true }).waitFor();
      report.dashboard.push(await dashboard.evaluate(() => {
        const navigation = performance.getEntriesByType("navigation")[0];
        const scripts = performance.getEntriesByType("resource").filter(entry =>
          entry.initiatorType === "script" && new URL(entry.name).pathname.startsWith("/_next/static/"));
        return {
          domInteractiveMs: Math.round(navigation.domInteractive),
          javascriptBytes: scripts.reduce((total, resource) => total + resource.encodedBodySize, 0),
          scripts: scripts.length,
        };
      }));
    } finally {
      await measurement.close();
    }
  }
  await open("/catalogs");

  if (!baseline) {
    await page.setViewportSize({ width: 360, height: 960 });
    await page.getByRole("button", { name: "Mở điều hướng" }).click();
    await page.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link", { name: "Đoàn viên", exact: true }).click();
    await page.waitForURL("**/members");
    await page.getByText("Đoàn viên thử nghiệm", { exact: true }).waitFor();
    await page.reload();
    await page.getByText("Đoàn viên thử nghiệm", { exact: true }).waitFor();
    await page.goBack();
    await page.waitForURL("**/catalogs");
    await page.goForward();
    await page.waitForURL("**/members");
    report.flows.push("Mobile navigation, refresh and browser history");

    await page.getByRole("button", { name: /Thêm Đoàn viên mới/ }).click();
    const add = page.getByRole("dialog", { name: "Thêm đoàn viên" });
    await add.getByLabel(/Họ và tên/).fill("Đoàn viên qua giao diện");
    await add.getByLabel(/Ngày sinh/).fill("2007-05-11");
    await add.getByLabel(/Số CCCD/).fill("000000000654");
    await add.getByLabel(/Mã nhân viên/).fill("FIXTURE02");
    const teamPicker = add.getByLabel(/Đơn vị Công đoàn/);
    const options = await teamPicker.locator("option").allTextContents();
    assert.ok(options.some(label => label.includes(directTeamName) && label.includes(centralName)));
    assert.ok(options.some(label => label.includes("Tổ đích thử nghiệm") && label.includes("CĐBP Khoa thử nghiệm")));
    assert.ok(options.includes(`[CĐBP] ${emptyDepartmentName}`));
    assert.ok(!options.includes("[CĐBP] CĐBP Khoa thử nghiệm"));
    await teamPicker.selectOption(team);
    await add.getByLabel(/Ngày vào CĐ/).fill("2025-05-10");
    await add.getByRole("button", { name: "Xác nhận thêm đoàn viên" }).click();
    await add.getByRole("alert").filter({ hasText: "Đoàn viên phải đủ 18 tuổi vào ngày vào công đoàn." }).waitFor();
    await add.getByLabel(/Ngày sinh/).fill("2007-05-10");
    await add.getByLabel("Loại cán bộ").selectOption("LaoDongHopDong");
    await add.getByRole("button", { name: "Thêm ngoại ngữ" }).click();
    await add.getByLabel(/Ngày cấp/).fill("2024-09-01");
    await add.getByLabel("Đơn vị cấp").fill("Đơn vị cấp thử nghiệm");
    await add.getByRole("button", { name: "Xác nhận thêm đoàn viên" }).click();
    const created = page.getByRole("link", { name: "Xem hồ sơ vừa thêm" });
    await created.waitFor();
    assert.match(await created.getAttribute("href"), /^\/members\/[\da-f-]+$/i);
    const newRow = page.getByRole("row").filter({ hasText: "FIXTURE02" });
    await newRow.waitFor();
    await newRow.getByRole("button", { name: /Điều động/ }).click();
    const transfer = page.getByRole("dialog", { name: "Chuyển sinh hoạt" });
    await transfer.getByLabel("Tổ CĐ đích").selectOption(targetTeam);
    await transfer.getByLabel("Lý do điều động").fill("Kiểm tra ghi lịch sử chuyển sinh hoạt");
    await transfer.getByRole("button", { name: "Xác nhận chuyển" }).click();
    await newRow.getByText("Tổ đích thử nghiệm").waitFor();
    await newRow.getByRole("link", { name: "Đoàn viên qua giao diện" }).click();
    await page.getByText("Kiểm tra ghi lịch sử chuyển sinh hoạt", { exact: true }).waitFor();
    await page.getByRole("button", { name: /Chỉnh sửa/ }).click();
    await page.getByLabel(/Họ và tên/).fill("Đoàn viên đã cập nhật");
    await page.getByRole("button", { name: /Thêm ngoại ngữ/ }).click();
    await page.getByLabel("Ngoại ngữ", { exact: true }).nth(1).selectOption("TIENG_PHAP");
    await page.getByRole("button", { name: /Lưu thay đổi/ }).click();
    await page.getByRole("heading", { name: "Đoàn viên đã cập nhật" }).waitFor();
    await page.getByRole("cell", { name: "Tiếng Pháp", exact: true }).waitFor();
    report.flows.push("Create, transfer, view history, edit member and save two language records");

    await open("/activities");
    await page.getByRole("button", { name: /Thêm Hoạt động/ }).click();
    const activity = page.getByRole("dialog", { name: "Thông tin hoạt động" });
    await activity.getByLabel(/Tên hoạt động/).fill("Hoạt động qua giao diện");
    await activity.getByLabel(/Địa điểm tổ chức/).fill("Phòng thử nghiệm");
    await activity.locator("input[type=file]").setInputFiles({
      name: "browser-fixture.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n"),
    });
    await activity.getByRole("link", { name: "browser-fixture.pdf" }).waitFor();
    await activity.getByRole("button", { name: "Lưu", exact: true }).dblclick();
    const activityRow = page.getByRole("row").filter({ hasText: "Hoạt động qua giao diện" });
    await activityRow.waitFor();
    assert.equal(await activityRow.count(), 1, "Double submission created duplicate activities");
    await activityRow.getByRole("button", { name: "Sửa", exact: true }).click();
    await activity.getByLabel(/Tên hoạt động/).fill("Hoạt động đã cập nhật");
    await activity.getByRole("button", { name: "Lưu", exact: true }).click();
    await page.getByText("Hoạt động đã cập nhật", { exact: true }).waitFor();
    const evidence = page.getByRole("row").filter({ hasText: "Hoạt động đã cập nhật" })
      .getByRole("link", { name: /Tải file minh chứng/ });
    const attachment = await context.request.get(await evidence.getAttribute("href"));
    assert.equal(attachment.status(), 200);
    assert.match(attachment.headers()["content-disposition"], /^attachment/);
    report.flows.push("Create and edit activity, avoid double submission, upload and download PDF");

    await open("/finance");
    await page.getByRole("button", { name: /Ghi nhận Giao dịch/ }).click();
    const finance = page.getByRole("dialog", { name: "Thông tin giao dịch" });
    await finance.getByLabel(/Loại giao dịch/).selectOption("THU_DOAN_PHI");
    await finance.getByLabel(/Số tiền/).fill("125000");
    await finance.getByLabel(/Người giao dịch/).fill("Giao dịch thử nghiệm");
    await finance.getByRole("button", { name: "Lưu", exact: true }).click();
    const receipt = page.getByRole("row").filter({ hasText: "Giao dịch thử nghiệm" });
    await receipt.getByRole("button", { name: "Sửa", exact: true }).click();
    await finance.getByLabel(/Số tiền/).fill("135000");
    await finance.getByRole("button", { name: "Lưu", exact: true }).click();
    await receipt.getByText(/135.000/).waitFor();
    await page.getByText("Tổng thu theo bộ lọc").locator("..").getByText(/135.000/).waitFor();
    report.flows.push("Record and edit finance transaction with updated totals");

    await open("/welfare");
    await page.getByRole("button", { name: /Yêu cầu Trợ cấp/ }).click();
    const welfare = page.getByRole("dialog", { name: "Đề xuất phúc lợi" });
    await welfare.getByLabel("Tìm theo tên hoặc mã nhân viên").fill("FIXTURE01");
    await welfare.getByLabel(/Đoàn viên nhận hỗ trợ/).selectOption(member);
    await welfare.getByLabel(/Lý do chi tiết/).fill("Đề xuất phúc lợi thử nghiệm");
    await welfare.getByRole("button", { name: "Lưu", exact: true }).click();
    const proposal = page.getByRole("row").filter({ hasText: "Đề xuất phúc lợi thử nghiệm" });
    await proposal.getByRole("button", { name: "Duyệt", exact: true }).click();
    await proposal.getByText(/Đã (duyệt|cấp)/).waitFor();
    report.flows.push("Find member, propose welfare and approve as CDCS");

    await open("/initiatives");
    await page.getByRole("button", { name: /Đăng ký Sáng kiến/ }).click();
    const initiative = page.getByRole("dialog", { name: "Thông tin sáng kiến" });
    await initiative.getByLabel("Tìm theo tên hoặc mã nhân viên").fill("FIXTURE01");
    await initiative.getByLabel(/Tác giả đăng ký/).selectOption(member);
    await initiative.getByLabel(/Tên đề tài/).fill("Sáng kiến qua giao diện");
    await initiative.getByRole("button", { name: "Lưu", exact: true }).click();
    await page.getByText("Sáng kiến qua giao diện", { exact: true }).waitFor();
    report.flows.push("Register initiative with a searched member");

    await open("/emulations");
    await page.getByRole("button", { name: /Khai báo Thi đua/ }).click();
    const emulation = page.getByRole("dialog", { name: "Thông tin thi đua" });
    await emulation.getByLabel(/Tên phong trào thi đua/).fill("Thi đua qua giao diện");
    await emulation.getByLabel(/Thi đua Tập thể/).selectOption(team);
    await emulation.getByLabel(/Năm thi đua/).fill("2026");
    await emulation.getByLabel(/Điểm BCH duyệt/).fill("90");
    await emulation.getByLabel(/Trạng thái thi đua/).selectOption("2");
    await emulation.getByRole("button", { name: "Lưu", exact: true }).click();
    await page.getByText("Thi đua qua giao diện", { exact: true }).waitFor();
    report.flows.push("Record evaluated emulation from UI");
    await open("/quality");
    await page.getByLabel("Năm báo cáo").fill("2026");
    await page.getByRole("button", { name: "Xem báo cáo" }).click();
    await page.getByText("1 hồ sơ", { exact: true }).waitFor();
    await page.getByLabel("Năm báo cáo").fill("2025");
    await page.getByRole("button", { name: "Xem báo cáo" }).click();
    await page.getByText("Chưa có kết quả đánh giá hoặc khen thưởng trong năm này.").waitFor();
    report.flows.push("Real annual report with populated and empty results");

    const statsPath = "**/api/v1/union-units/stats";
    await page.route(statsPath, route => route.abort("failed"), { times: 1 });
    await open("/");
    await page.getByRole("alert").filter({ hasText: "Không thể tải dữ liệu" }).waitFor();
    await page.getByRole("button", { name: "Thử lại" }).click();
    await page.getByText("Đoàn viên đang sinh hoạt", { exact: true }).waitFor();
    await page.getByText("Xem phân bổ và số liệu nghiệp vụ", { exact: true }).click();
    await page.getByRole("heading", { name: "Chứng chỉ theo ngoại ngữ" }).waitFor();
    report.flows.push("Network failure and retry");

    await post("/auth/logout", undefined, 204);
    await page.reload();
    await page.waitForURL("**/login");
    await page.getByRole("button", { name: "Đăng nhập" }).waitFor();
    report.flows.push("Revoked session redirects to login on reload");

    // Chromium exercises all roles from one loopback IP. Keep the production API quota intact.
    const nextApiWindow = firstApiWindow + 62_000 - Date.now();
    if (nextApiWindow > 0) await delay(nextApiWindow);
    const departmentFactor = await enroll(departmentAccount.username, departmentActivation, departmentPassword);
    await page.waitForURL(origin + "/");
    await open("/members");
    const addMember = page.getByRole("button", { name: /Thêm Đoàn viên mới/ });
    const directAdmission = page.getByRole("dialog", { name: "Thêm đoàn viên" });
    await addMember.press("Enter");
    await directAdmission.getByLabel(/Họ và tên/).waitFor();
    assert.equal(await directAdmission.evaluate(node => node.contains(document.activeElement)), true);
    await page.keyboard.press("Escape");
    await directAdmission.waitFor({ state: "hidden" });
    assert.equal(await addMember.evaluate(node => node === document.activeElement), true);
    report.flows.push("Keyboard focus enters the admission dialog and returns to its trigger on Escape");

    await addMember.click();
    const unitPicker = directAdmission.getByLabel(/Đơn vị Công đoàn/);
    await unitPicker.waitFor();
    await page.setViewportSize({ width: 360, height: 960 });
    await page.screenshot({ path: join(output, "member-admission-dialog-360.png") });
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.screenshot({ path: join(output, "member-admission-dialog-1440.png") });
    assert.equal(await unitPicker.inputValue(), emptyDepartmentId);
    assert.deepEqual(await unitPicker.locator("option").allTextContents(), [
      "Chọn đơn vị tiếp nhận", `[CĐBP] ${emptyDepartmentName}`,
    ]);
    await directAdmission.getByLabel(/Họ và tên/).fill("Đoàn viên sinh hoạt trực tiếp");
    await directAdmission.getByLabel(/Ngày sinh/).fill("1993-02-01");
    await directAdmission.getByLabel(/Số CCCD/).fill("000000000655");
    await directAdmission.getByLabel(/Mã nhân viên/).fill("FIXTURE03");
    await directAdmission.getByLabel(/Ngày vào CĐ/).fill("2025-05-10");
    await directAdmission.getByRole("button", { name: "Xác nhận thêm đoàn viên" }).click();
    const directRow = page.getByRole("row").filter({ hasText: "FIXTURE03" });
    await directRow.getByText(emptyDepartmentName, { exact: true }).waitFor();
    await page.getByRole("link", { name: "Xem hồ sơ vừa thêm" }).click();
    await page.getByRole("heading", { name: "Đoàn viên sinh hoạt trực tiếp" }).waitFor();
    await page.getByText(emptyDepartmentName, { exact: true }).first().waitFor();
    report.flows.push("Department account admits a member directly before creating a team");

    await page.getByRole("link", { name: "Bảo mật tài khoản" }).click();
    await page.getByText("Đang bật", { exact: true }).waitFor();
    await capture("/account-security");
    await post("/auth/logout", undefined, 204);
    await page.goto("/login");
    await signIn(departmentAccount.username, departmentPassword);
    await page.getByRole("heading", { name: "Xác thực hai bước" }).waitFor();
    assert.equal(await page.getByLabel("Mật khẩu", { exact: true }).count(), 0);
    await page.getByRole("button", { name: "Dùng mã khôi phục" }).click();
    await page.getByLabel("Mã khôi phục", { exact: true }).fill(departmentFactor.codes[0]);
    await page.getByRole("button", { name: "Tiếp tục khôi phục" }).click();
    const replacementKey = await readSetupKey();
    const replacementStep = currentTotpStep();
    await page.getByLabel("Mã Authenticator", { exact: true }).fill(fixtureTotpAt(replacementKey, replacementStep));
    await page.getByRole("button", { name: "Xác nhận thiết bị mới" }).click();
    await page.getByRole("heading", { name: "Lưu mã khôi phục" }).waitFor();
    await page.getByRole("button", { name: "Tôi đã lưu mã" }).click();
    await signIn(departmentAccount.username, departmentPassword);
    await verifyFactor(replacementKey, replacementStep);
    await page.waitForURL(origin + "/");
    await open("/account-security");
    await page.getByText("Đang bật", { exact: true }).waitFor();
    report.flows.push("Recovery code replaces the Authenticator and requires a new password-plus-OTP login");

    assert.deepEqual(report.screens.filter(screen => screen.overflow > 1), []);
    assert.deepEqual(report.accessibility.filter(result => result.violations.length), []);
    assert.deepEqual(report.browserErrors, []);
    assert.deepEqual(report.apiFailures, []);
  }
  await rm(join(output, "failure.png"), { force: true });
  console.log(`${report.screens.length} screenshots, ${report.screens.filter(screen => screen.overflow > 1).length} overflowing screens, ${report.browserErrors.length} browser errors, ${report.apiFailures.length} unexpected API errors.`);

  async function signIn(username, credential) {
    await page.getByLabel("Tên đăng nhập").fill(username);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(credential);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
  }

  async function changePassword(current, next, otp) {
    await page.getByRole("heading", { name: "Đổi mật khẩu", exact: true }).waitFor();
    await page.getByLabel("Mật khẩu hiện tại").fill(current);
    const nextField = baseline ? page.getByLabel(/Mật khẩu mới \(/) : page.getByLabel("Mật khẩu mới", { exact: true });
    if (!baseline) {
      const rules = page.getByRole("list", { name: "Điều kiện mật khẩu" });
      await nextField.fill("Abcdef12");
      assert.match(await rules.locator("li").filter({ hasText: "Có ký tự đặc biệt" }).textContent(), /Chưa đạt/);
      await nextField.fill(next);
      assert.match(await rules.locator("li").filter({ hasText: "Có ký tự đặc biệt" }).textContent(), /Đạt/);
    } else await nextField.fill(next);
    if (otp) {
      await page.getByLabel("Xác nhận mật khẩu mới").fill(next);
      await page.getByLabel("Mã Authenticator", { exact: true }).fill(otp);
    }
    await page.getByRole("button", { name: "Đổi mật khẩu" }).click();
    await page.getByText("Đã đổi mật khẩu. Vui lòng đăng nhập lại.").waitFor();
  }

  async function readSetupKey() {
    const qr = page.getByRole("img", { name: /Mã QR/ });
    await qr.waitFor();
    assert.equal(await qr.evaluate(image => image.complete && image.naturalWidth > 0), true);
    await page.getByText("Nhập khóa thiết lập thủ công").click();
    const key = await page.locator("main code").textContent();
    assert.match(key, /^[A-Z2-7]{32}$/);
    return key;
  }

  async function verifyFactor(key, lastStep) {
    const factor = await nextFixtureTotp(key, lastStep);
    await page.getByLabel("Mã Authenticator", { exact: true }).fill(factor.code);
    await page.getByRole("button", { name: "Xác nhận mã" }).click();
    return factor.step;
  }

  async function enroll(username, activation, credential) {
    await signIn(username, initialPassword);
    await page.getByLabel("Mật khẩu hiện tại").fill(initialPassword);
    await page.getByLabel("Mã kích hoạt", { exact: true }).fill(activation);
    await page.getByRole("button", { name: "Tạo mã QR" }).click();
    const key = await readSetupKey();
    const factor = await nextFixtureTotp(key, -1);
    await page.getByLabel("Mã Authenticator", { exact: true }).fill(factor.code);
    await page.getByRole("button", { name: "Xác nhận và bật" }).click();
    await page.getByRole("heading", { name: "Lưu mã khôi phục" }).waitFor();
    const codes = await page.getByRole("region", { name: "Mã khôi phục" }).locator("code").allTextContents();
    assert.equal(codes.length, 10);
    await page.getByRole("button", { name: "Tôi đã lưu mã" }).click();
    const rotation = await nextFixtureTotp(key, factor.step);
    await changePassword(initialPassword, credential, rotation.code);
    await signIn(username, credential);
    await verifyFactor(key, rotation.step);
    await page.waitForURL(origin + "/");
    return { codes };
  }

  async function post(path, data, expected = 200) {
    const csrf = await context.request.get("/api/v1/auth/csrf");
    assert.equal(csrf.status(), 200);
    const response = await context.request.post("/api/v1" + path, {
      headers: { "X-CSRF-Token": (await csrf.json()).token }, data,
    });
    assert.equal(response.status(), expected, path + " " + (await response.text()));
    return expected === 204 ? undefined : (await response.json()).data;
  }

  async function open(route) {
    const response = await page.goto(route);
    assert.equal(response.status(), 200, route);
    await page.locator("main h1, main h2, main h3").first().waitFor();
    await page.evaluate(async () => { await document.fonts.ready; });
  }

  async function capture(route) {
    const name = route === "/" ? "dashboard" : route.startsWith("/members/") ? "member-detail" : route.slice(1);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 960 });
      const overflow = await page.evaluate(() => {
        const main = document.querySelector("main");
        return Math.max(document.documentElement.scrollWidth - window.innerWidth,
          main ? main.scrollWidth - main.clientWidth : 0);
      });
      await page.screenshot({ path: join(output, `${name}-${width}.png`) });
      report.screens.push({ route: name, width, overflow });
    }
    if (!baseline || ["login", "dashboard", "members", "quality"].includes(name)) {
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      report.accessibility.push({ route: name, violations: results.violations.map(({ id, nodes }) => ({
        id, nodes: nodes.length, targets: nodes.map(node => node.target),
      })) });
    }
  }
} catch (error) {
  if (page && !page.isClosed()) await page.screenshot({ path: join(output, "failure.png"),
    mask: [page.locator('input[type="password"], input[autocomplete="one-time-code"], input[autocomplete="off"], code, img[src^="data:image/png"]')],
  }).catch(() => {});
  throw error;
} finally {
  try {
    await writeFile(join(output, "report.json"), JSON.stringify(report, null, 2) + "\n");
  } finally {
    await browser?.close();
    ingress?.close();
    await Promise.all(children.map(child => new Promise(done => {
      if (child.exitCode !== null || child.signalCode !== null) return done();
      child.once("exit", done);
      child.kill();
    })));
    await rm(storage, { recursive: true, force: true, maxRetries: 3 });
  }
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

async function availablePort() {
  const socket = createServer();
  const port = await listen(socket);
  await new Promise(done => socket.close(done));
  return port;
}

async function start(command, args, cwd, env, ready) {
  const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, windowsHide: true });
  children.push(child);
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk; });
  child.stderr.on("data", chunk => { logs += chunk; });
  for (let count = 0; count < 120; count++) {
    const match = logs.match(ready);
    if (match) return match[1];
    if (child.exitCode !== null) break;
    await new Promise(done => setTimeout(done, 250));
  }
  throw new Error(`Test server failed to start: ${logs}`);
}
