import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';

// Isolated browser fixtures: generated a page at a time; no database or personal data.
const before = process.argv.includes('--before');
const output = resolve('../../artifacts/ui-quality', before ? 'before' : 'after');
await mkdir(output, { recursive: true });
const socket = createServer();
await new Promise(done => socket.listen(0, '127.0.0.1', done));
const port = socket.address().port;
await new Promise(done => socket.close(done));
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], { stdio: 'pipe' });
let log = '';
server.stdout.on('data', chunk => { log += chunk; });
server.stderr.on('data', chunk => { log += chunk; });
const report = { tables: [], responsive: [], pagination: [], dialogs: [], expectedConsoleErrors: [], networkFailures: [], accessibility: [], errors: [], unexpectedRequests: [] };
let browser;
const long = 'Dữ liệu tổng hợp – Nguyễn Thị Ánh & Đơn vị nghiên cứu / thử nghiệm '.repeat(3);
const token = 'TiếngViệtCóDấu_'.repeat(12);
const id = n => `00000000-0000-4000-8000-${String(n + 1).padStart(12, '0')}`;
const row = n => ({
  id: id(n), hoTen: `${n + 1}. ${long}`, username: `tcd_thu_nghiem_${n + 1}`, vaiTro: 'DoanVien', trangThai: 'DangSinhHoat',
  maNhanVien: `UI${n + 1}`, soCCCD: null, gioiTinh: 'Nam', ngaySinh: '1990-01-01',
  tenToCongDoan: long, tenCDBP: long, tenDonVi: long, donViTen: long, chucVu: token, donViCongTac: long,
  maToCongDoan: id(830), donViId: id(830), doanVienId: id(n), loaiCanBo: 'SiQuan', ngayVaoCongDoan: '2025-01-01',
  tenHoatDong: `${n + 1}. ${long}`, loaiHoatDong: 'PHONG_TRAO', tuNgay: '2026-01-01', denNgay: '2026-12-31',
  diaDiem: token, kinhPhi: 999999999999, moTa: n % 2 ? long : null, ghiChu: n % 2 ? token : null,
  tenDeTai: `${n + 1}. ${long}`, hieuQuaKinhTe: long, capDeTai: 'CO_SO', linhVuc: long, namThucHien: 2026,
  tenPhongTrao: `${n + 1}. ${long}`, nam: 2026, diemTuDanhGia: 99.5, diemBchDuyet: null,
  hoTenDoanVien: `${n + 1}. ${long}`, nguoiGiaoDich: `${n + 1}. ${long}`, lyDo: token, soTien: 999999999999, ngayGiaoDich: '2026-11-27', loaiGiaoDich: 'Thu',
  ngayHoTro: '2026-11-27', kinhPhiHoTro: 999999999999, loaiPhucLoi: 'OM_DAU', ma: `UI_${n}`, ten: `${n + 1}. ${long}`, thuTu: n, organizationActive: true, canSignIn: true, authenticatorEnabled: true,
});
const cases = [
  ['/members', 'union-members', 'Bảng đoàn viên', 'ADMIN'],
  ['/accounts', 'accounts', 'Bảng tài khoản', 'ADMIN'],
  ['/catalogs', 'catalogs', 'Bảng danh mục', 'ADMIN'],
  ['/activities', 'activities', 'Bảng hoạt động', 'CDCS'],
  ['/finance', 'finance', 'Bảng giao dịch', 'CDCS'],
  ['/welfare', 'welfare', 'Bảng hồ sơ phúc lợi', 'CDCS'],
  ['/initiatives', 'initiatives', 'Bảng sáng kiến', 'CDCS'],
  ['/emulations', 'emulations', 'Bảng hồ sơ thi đua', 'CDCS'],
];
let role = 'ADMIN', endpoint = 'union-members', total = 50, fail = false, slow = false, allowDelete = false;
let requests = [];
try {
  for (let attempt = 0; !log.includes('Ready in'); attempt++) {
    if (attempt > 160 || server.exitCode !== null) throw Error(`Next start failed: ${log}`);
    await new Promise(done => setTimeout(done, 100));
  }
  browser = await chromium.launch({ executablePath: process.env.QLCD_CHROMIUM_PATH });
  const context = await browser.newContext({ baseURL: `http://127.0.0.1:${port}`, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    if (/status of (404|503)/.test(message.text())) report.expectedConsoleErrors.push(message.text());
    else report.errors.push(message.text());
  });
  page.on('requestfailed', request => {
    if (!request.failure()?.errorText.includes('ERR_ABORTED')) report.networkFailures.push(new URL(request.url()).pathname);
  });
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace('/api/v1/', '');
    const answer = json => route.fulfill({ json });
    if (path === 'auth/session' || path === 'auth/authenticator') return answer({ data: { id: id(900), hoTen: 'Tài khoản tổng hợp UI', vaiTro: role, donViTen: long, organizationId: id(800), authenticatorEnabled: true, mustChangePassword: false, needsAuthenticator: false } });
    if (path === 'auth/csrf') return answer({ token: 'ui-test-only' });
    if (allowDelete && route.request().method() === 'DELETE' && path.startsWith(endpoint + '/')) {
      total--; return route.fulfill({ status: 204 });
    }
    if (route.request().method() !== 'GET') { report.unexpectedRequests.push(`${route.request().method()} ${path}`); return route.abort(); }
    if (path.startsWith('union-members/')) return answer({ data: { ...row(0), gioiTinh: 1, diaChiLienHe: token, queQuan: long, ngoaiNgus: [], lichSuBienDong: Array.from({ length: 50 }, (_, n) => ({ id: id(1000+n), loaiBienDong: 'KetNapMoi', ngayHieuLuc: '2026-01-01T00:00:00Z', tuToCongDoan: null, denToCongDoan: long, lyDo: token })) } });
    if (path === 'union-units/tree') return answer({ data: { id: id(800), tenDonVi: long, loaiToChuc: 'CDCS', level: 1, soDoanVien: total, trangThai: 1, children: Array.from({ length: 10 }, (_, n) => ({ id: id(810 + n), tenDonVi: long, loaiToChuc: 'CDBP', level: 2, trangThai: 1, soDoanVien: 50, children: [{ id: id(830 + n), tenDonVi: long, loaiToChuc: 'TO_CD_THUOC_CDBP', level: 3, trangThai: 1, soDoanVien: 50, children: [] }] })) } });
    if (path === endpoint || path === 'union-members') {
      if (path === endpoint) requests.push(Object.fromEntries(url.searchParams));
      if (slow) await new Promise(done => setTimeout(done, 600));
      if (fail) return route.fulfill({ status: 503, json: { message: 'Lỗi thử nghiệm tổng hợp' } });
      const number = Number(url.searchParams.get('page') || 1), size = Number(url.searchParams.get('pageSize') || 50);
      const count = url.searchParams.get('search') ? Math.min(total, 1) : total;
      const start = (number - 1) * size;
      const data = Array.from({ length: Math.max(0, Math.min(size, count - start)) }, (_, index) => {
        const result = row(start + index);
        if (path === 'accounts') return { ...result, vaiTro: 'TOCD', trangThai: true };
        if (['welfare','initiatives','emulations'].includes(path)) return { ...result, trangThai: (start + index) % 3 + 1, doanVienId: id(start + index) };
        return result;
      });
      if (path === 'union-members') return answer({ data: { items: data, totalCount: count, page: number, pageSize: size } });
      return answer({ data, hasMore: start + size < count, totals: { receipt: 999999999999, expense: 0 }, canResetCredentials: false, credentialPolicy: { initialPassword: '123456aA@', temporaryPasswordLifetimeHours: 24, activationCodeLifetimeHours: 24 } });
    }
    if (path === 'emulations/summary') return answer({ data: { year: 2026, registered: 10000, evaluated: 500, awarded: 100, ratings: [{ code: 'TOT', name: long, count: 500 }] } });
    if (path === 'union-units/stats') {
      const data = Object.fromEntries(['tongDoanVien','doanVienNam','doanVienNu','doanVienDangSinhHoat','doanVienDangVien','tiLeDangVien','tiLeNu','tongCDBP','tongToCongDoan','ketNapMoiThang','chuyenDiThang','nghiHuuThang','tongThuDoanPhi','tongChi','tonQuy','soHoatDong','soLuotPhucLoi','soSangKien','soKetQuaThiDua'].map(key => [key,10000]));
      for (const key of ['Cdbp','ToCd','Khoi','GioiTinh','TrangThai','ChucVu','NgoaiNgu','TrinhDo']) data['doanVienTheo' + key] = Array.from({ length: 50 }, () => ({ name: long, count: 200 }));
      return answer({ data });
    }
    if (['catalogs','management-blocks','union-units/inactive'].includes(path)) return answer({ data: [], hasMore: false });
    report.unexpectedRequests.push(`GET ${path}`);
    return answer({ data: [] });
  });
  async function settled() { await page.locator('main h1').waitFor(); await page.waitForFunction(() => !document.querySelector('main')?.textContent.includes('Đang tải')); }
  for (const [path, api, label, accountRole] of cases) {
    role = accountRole; endpoint = api;
    for (const count of [0,1,7,20,50,100,500,1000,10000]) {
      total = count; requests = []; const started = Date.now();
      await page.goto(path);
      if (api === 'catalogs') await page.getByRole('button', { name: 'Loại tổ chức công đoàn', exact: true }).click();
      const region = page.getByRole('region', { name: label, exact: true });
      await region.locator('tbody tr').first().waitFor(); await settled();
      const rows = await region.locator('tbody tr').count();
      assert.equal(rows, Math.max(1, Math.min(count, 50)), `${path} one page only`);
      if (count === 10000) {
        await page.getByRole('navigation', { name: 'Phân trang', exact: true }).getByRole('button', { name: 'Trang sau', exact: true }).click();
        await settled();
        await region.getByText(api === 'accounts' ? 'tcd_thu_nghiem_51' : new RegExp('^51\\.')).first().waitFor();
        assert.equal(requests.at(-1).page, '2');
        report.pagination.push({ path, total: count, serverPage: 2, rows: await region.locator('tbody tr').count() });
      }
      report.tables.push({ path, total: count, renderedRows: rows, renderMs: Date.now() - started });
    }
    total = 100; await page.goto(path);
      if (api === 'catalogs') await page.getByRole('button', { name: 'Loại tổ chức công đoàn', exact: true }).click();
    const region = page.getByRole('region', { name: label, exact: true });
    await region.locator('tbody tr').nth(10).waitFor(); await settled();
    for (const [width,height] of [[1920,1080],[1600,900],[1440,900],[1366,768],[1280,720],[1024,768],[768,1024],[390,844],[360,640]]) {
      await page.setViewportSize({ width, height });
      const measured = await region.evaluate(element => {
        element.scrollTop = 200; element.scrollLeft = 200;
        return { overflow: document.documentElement.scrollWidth - innerWidth, horizontal: element.scrollLeft, vertical: element.scrollTop, stickyOffset: Math.abs(element.querySelector('th').getBoundingClientRect().top - element.getBoundingClientRect().top), pagerInside: !!element.querySelector('nav') };
      });
      if (!before) {
        const visible = await region.evaluate(el => {
          el.scrollLeft = el.scrollWidth; el.scrollTop = 0;
          const viewport = el.getBoundingClientRect();
          const actions = el.querySelector('tbody tr td:last-child').getBoundingClientRect();
          const amounts = [...el.querySelectorAll('tbody tr:first-child td.font-mono')].every(cell => {
            const range = document.createRange(); range.selectNodeContents(cell);
            const lines = new Set([...range.getClientRects()].map(rect => Math.round(rect.top)));
            return lines.size <= 1;
          });
          return { actions: actions.right <= viewport.right + 1 && actions.left < viewport.right, amounts };
        });
        assert.ok(visible.actions, `${path} last column reachable`);
        assert.ok(visible.amounts, `${path} numbers and dates remain intact`);
      }
      report.responsive.push({ path, width, height, ...measured });
      if (!before) {
        assert.ok(measured.overflow <= 1, `${path} overflow at ${width}`);
        assert.ok(measured.vertical > 0, `${path} vertical scroll`);
        assert.ok(measured.stickyOffset <= 2, `${path} sticky headings`);
        assert.equal(measured.pagerInside, false, `${path} pager outside scroll`);
        if (width <= 768) assert.ok(measured.horizontal > 0, `${path} horizontal scroll`);
      }
      if ([390,1366].includes(width)) {
        await region.evaluate(el => { el.scrollTop = 0; el.scrollLeft = 0; });
        await page.screenshot({ path: join(output, `${api}-${width}.png`) });
      }
    }
    if (!before) {
      // CSS viewport equivalents of zoom; native browser zoom needs manual acceptance.
      for (const zoom of [0.8,1,1.25,1.5,2]) {
        await page.setViewportSize({ width: Math.round(1280/zoom), height: Math.round(720/zoom) });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path} reflow ${zoom}`);
      }
      const summary = region.locator('details summary').first();
      if (await summary.count()) {
        await region.evaluate(el => { el.scrollTop = 0; el.scrollLeft = 0; });
        await summary.focus(); await page.keyboard.press('Enter');
        assert.equal(await summary.evaluate(el => el.parentElement.open), true);
        assert.ok((await summary.locator('..').locator('p').textContent()).length > 120);
        await page.keyboard.press('Enter');
        assert.equal(await summary.evaluate(el => el.parentElement.open), false);
      }
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
      report.accessibility.push({ path, violations: axe.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })) });
    }
  }
  if (!before) {
    role = 'ADMIN'; endpoint = 'union-members'; total = 10000; await page.goto('/members'); await settled();
    for (const size of [10,20,50,100]) {
      await page.getByLabel('Số dòng mỗi trang').selectOption(String(size));
      await page.waitForFunction(size => document.querySelectorAll('tbody tr').length === size, size);
      report.pagination.push({ path: '/members', size, total: 10000 });
    }
    // Failure/loading/retry and filter reset remain observable with the same list contract.
    fail = true; await page.goto('/members');
    await page.getByRole('button', { name: 'Thử lại', exact: true }).first().waitFor();
    fail = false; slow = true;
    await page.getByRole('button', { name: 'Thử lại', exact: true }).first().click();
    await page.getByRole('status').filter({ hasText: 'Đang tải' }).waitFor();
    await settled(); slow = false;
    const search = page.locator('input[placeholder]').first();
    await search.fill('Nguyễn');
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 1);
    assert.equal(requests.at(-1).page, '1');
    await search.fill(''); await settled();
    report.pagination.push({ path: '/members', filterReset: true, retry: true, loading: true });

    for (const [path, api, , accountRole] of cases.filter(c => c[0] !== '/accounts')) {
      role = accountRole; endpoint = api; total = 50;
      await page.goto(path);
      if (api === 'catalogs') await page.getByRole('button', { name: 'Loại tổ chức công đoàn', exact: true }).click();
      await settled();
      const trigger = page.getByRole('button', { name: /Thêm Đoàn viên mới|Thêm Hoạt động|Ghi nhận|Yêu cầu Trợ cấp|Đăng ký|Thêm Danh mục|Khai báo Thi đua/ }).first();
      if (await trigger.count() === 0) continue;
      await trigger.click();
      const dialog = page.getByRole('dialog'); await dialog.waitFor();
      assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true);
      for (const [width,height] of [[360,640],[1280,720]]) {
        await page.setViewportSize({ width, height });
        await dialog.getByRole('button', { name: /^Hủy( bỏ)?$/ }).scrollIntoViewIfNeeded();
        assert.ok(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${path} dialog horizontal overflow`);
        const bounds = await dialog.boundingBox();
        assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= height + 1, `${path} dialog viewport bounds`);
        report.dialogs.push({ path, width, height, scrollable: await dialog.evaluate(el => el.scrollHeight > el.clientHeight) });
      }
      await page.screenshot({ path: join(output, path.slice(1) + '-dialog.png') });
      await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' });
      assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
    }
    // Supplemental screens and role-dependent navigation with purely synthetic sessions.
    for (const accountRole of ['ADMIN','CDCS','CDBP','TOCD']) {
      role = accountRole;
      for (const path of ['/','/organizations','/quality','/account-security',`/members/${id(0)}`,'/not-a-real-page']) {
        await page.goto(path); await page.locator('main').waitFor(); await settled();
        for (const [width,height] of [[360,640],[1366,768]]) {
          await page.setViewportSize({ width, height });
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${accountRole} ${path} reflow`);
          report.responsive.push({ path, role: accountRole, width, height });
        }
      }
    }
    // Conditional controls/navigation for scoped roles; these mocks do not replace backend permission tests.
    for (const accountRole of ['CDBP','TOCD']) {
      role = accountRole; total = 7;
      for (const [path, api] of cases) {
        endpoint = api;
        await page.goto(path); await settled();
        if (['accounts','catalogs'].includes(api)) await page.getByRole('heading', { name: 'Bạn chưa có quyền mở trang này' }).waitFor();
        for (const [width,height] of [[390,844],[1280,720]]) {
          await page.setViewportSize({ width, height });
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${accountRole} ${path} reflow`);
          report.responsive.push({ path, role: accountRole, width, height });
        }
      }
    }
    // Delete only mocked records; verify the last row of page 2 returns to page 1.
    for (const [path, api, label, accountRole] of cases.filter(c => !['accounts','welfare'].includes(c[1]))) {
      role = accountRole; endpoint = api; total = 51; allowDelete = true;
      await page.goto(path);
      if (api === 'catalogs') await page.getByRole('button', { name: 'Loại tổ chức công đoàn', exact: true }).click();
      const region = page.getByRole('region', { name: label, exact: true });
      await region.locator('tbody tr').nth(10).waitFor();
      const pager = page.getByRole('navigation', { name: 'Phân trang', exact: true });
      await pager.getByRole('button', { name: 'Trang sau', exact: true }).click();
      await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 1);
      assert.equal(await pager.getByRole('button', { name: 'Trang sau', exact: true }).isDisabled(), true);
      const remove = region.getByRole('button', { name: /Xóa/ }).first();
      await remove.click();
      await page.getByRole('dialog', { name: 'Xác nhận thao tác', exact: true }).getByRole('button', { name: 'Đồng ý', exact: true }).click();
      await region.locator('tbody tr').nth(10).waitFor();
      assert.equal(requests.at(-1).page, '1');
      report.pagination.push({ path, deleteLastRowReturnsToPreviousPage: true });
      allowDelete = false;
    }
    assert.deepEqual(report.accessibility.filter(a => a.violations.length), []);
  }
  assert.deepEqual(report.networkFailures, []); assert.deepEqual(report.errors, []); assert.deepEqual(report.unexpectedRequests, []);
  console.log(`UI quality: ${report.tables.length} datasets, ${report.responsive.length} viewports, ${report.pagination.length} pagination checks.`);
} finally {
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser?.close();
  if (server.exitCode === null) { const closed = new Promise(done => server.once('exit', done)); server.kill(); await closed; }
}
