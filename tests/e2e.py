"""
Pengujian end-to-end KolabKuis (Playwright, Python).

Menjalankan:
  1. Database LOKAL berisi data demo:  npm run db:push && npm run db:seed
     (JANGAN arahkan ke database produksi: tes ini menambah dan menghapus data)
  2. Jalankan aplikasi:                 npm run build && npm start
  3. pip install playwright && python -m playwright install chromium
  4. python tests/e2e.py
     Opsional: KOLABKUIS_URL=http://localhost:3000  CHROME_PATH=/path/ke/chrome  SHOTS=folder-screenshot

Setiap pemeriksaan mencetak PASS/FAIL; exit code 1 jika ada yang gagal.
"""
import os
import re
import sys
import time

from playwright.sync_api import sync_playwright

BASE = os.environ.get("KOLABKUIS_URL", "http://localhost:3000").rstrip("/")
CHROME = os.environ.get("CHROME_PATH")
SHOTS = os.environ.get("SHOTS")
results = []


def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    results.append((bool(cond), msg))


def shot(page, name, full=True):
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(SHOTS, f"{name}.png"), full_page=full)


def play_quiz(page, choose=lambda i: i % 4):
    """Kerjakan kuis yang sudah dimulai sampai halaman hasil; kembalikan jumlah soal."""
    page.wait_for_selector("text=/Soal 1 dari \\d+/")
    total = int(re.search(r"Soal 1 dari (\d+)", page.content()).group(1))
    for i in range(total):
        page.locator("ul[role=list] button").nth(choose(i)).click()
        page.wait_for_selector("text=/Benar\\.|Belum tepat/")
        page.get_by_role("button", name=re.compile("Soal berikutnya|Lihat hasil")).click()
        if i < total - 1:
            page.wait_for_selector(f"text=Soal {i + 2} dari {total}")
    page.wait_for_url("**/hasil/**")
    return total


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME) if CHROME else p.chromium.launch()
    errors = []

    # ---------- Pengunjung ----------
    ctx = browser.new_context(viewport={"width": 1366, "height": 860})
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))

    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    page.get_by_role("button", name=re.compile("Stack")).first.click()
    check(page.get_by_text("Benar, +10 poin.").is_visible(), "contoh soal di landing page memberi umpan balik")

    page.goto(BASE + "/dashboard")
    check("/masuk" in page.url, "dashboard dialihkan ke halaman masuk saat belum login")

    # ---------- Anggota baru ----------
    page.goto(BASE + "/daftar")
    page.fill("#name", "Penguji Satu")
    page.fill("#email", "bad-email")
    page.fill("#password", "12345678")
    page.click("button[type=submit]")
    page.wait_for_timeout(800)
    check(page.get_by_text("Format email tidak valid").is_visible(), "registrasi memvalidasi email")
    email = f"uji{int(time.time())}@test.id"
    page.fill("#email", email)
    page.fill("#university", "Universitas Uji")
    page.click("button[type=submit]")
    page.wait_for_url("**/dashboard")
    check(page.get_by_text("Halo, Penguji.").is_visible(), "registrasi berhasil dan langsung login")

    page.fill("#code", "ZZZZZZ")
    page.get_by_role("button", name="Gabung").click()
    page.wait_for_timeout(800)
    check(page.get_by_text("tidak ditemukan").is_visible(), "kode kelas salah ditolak")
    page.fill("#code", "sdif2a")
    page.get_by_role("button", name="Gabung").click()
    page.wait_for_url("**/kelas/**")
    check(page.get_by_text("Struktur Data, Kelas IF-A").first.is_visible(), "gabung kelas dengan kode (huruf kecil) berhasil")
    class_url = page.url

    page.get_by_role("link", name=re.compile("Bab 3")).click()
    page.wait_for_url("**/bank/**")
    set_url = page.url
    set_id = set_url.rsplit("/", 1)[1]
    check(page.get_by_text("Disembunyikan dari kuis").count() >= 1, "soal bermasalah dari data demo tersembunyi dari kuis")

    # Kunci jawaban tidak terlihat (dan tidak ada di HTML) sebelum soal dikerjakan
    check(page.locator("summary", has_text="Lihat kunci").count() == 0, "anggota tidak melihat kunci sebelum mengerjakan soal")
    check("Circular array memakai indeks" not in page.content(), "pembahasan soal yang belum dikerjakan tidak dikirim ke browser")

    first = page.locator("article").first
    before = int(first.locator("[aria-label^='Skor']").inner_text())
    first.get_by_role("button", name="Soal ini bagus").click()
    page.wait_for_timeout(1000)
    after = int(page.locator("article").first.locator("[aria-label^='Skor']").inner_text())
    check(after == before + 1, f"vote naik menambah skor ({before} -> {after})")
    page.locator("article").first.get_by_role("button", name="Soal ini bagus").click()
    page.wait_for_timeout(1000)
    check(int(page.locator("article").first.locator("[aria-label^='Skor']").inner_text()) == before, "klik kedua membatalkan vote")

    art = page.locator("article").nth(1)
    art.locator("summary", has_text="Laporkan").click()
    art.locator("input[name=reason]").fill("Pilihan D kurang jelas")
    art.get_by_role("button", name="Kirim laporan").click()
    page.wait_for_timeout(1200)
    check(page.get_by_text("sudah melaporkan").count() >= 1, "laporan soal terkirim")

    page.get_by_role("link", name="Tulis soal").first.click()
    page.wait_for_url("**/soal/baru")
    page.fill("#prompt", "Notasi prefix dari ekspresi A * B + C adalah?")
    for i, o in enumerate(["+ * A B C", "* A + B C", "A B * C +", "+ A * B C"]):
        page.fill(f"#option{i}", o)
    page.click("button[type=submit]:has-text('Simpan soal')")
    page.wait_for_timeout(800)
    check(page.get_by_text("Pilih kunci jawaban").is_visible(), "form soal mewajibkan kunci jawaban")
    page.locator("label:has(input[name=correctIndex][value='0'])").click()
    page.fill("#explanation", "Perkalian didahulukan: * A B, lalu ditambah C menjadi + * A B C.")
    page.get_by_role("button", name="Simpan dan tulis lagi").click()
    page.wait_for_timeout(1200)
    check(page.get_by_text("Soal tersimpan").is_visible(), "simpan dan tulis lagi berhasil")
    check(page.input_value("#prompt") == "", "form dikosongkan setelah disimpan")

    page.goto(set_url)
    mine = page.locator("article", has_text="Notasi prefix")
    check(mine.count() == 1, "soal baru muncul di bank soal")
    check(mine.locator("summary", has_text="Lihat kunci").count() == 1, "penulis melihat kunci soalnya sendiri")
    check(mine.get_by_role("button", name="Soal ini bagus").is_disabled(), "penulis tidak bisa memberi vote pada soalnya sendiri")
    mine.get_by_role("link", name="Ubah").click()
    page.wait_for_url("**/edit")
    page.fill("#prompt", "Notasi prefix dari ekspresi A * B + C adalah…")
    page.get_by_role("button", name="Simpan perubahan").click()
    page.wait_for_url(set_url)
    check(page.get_by_text("A * B + C adalah…").is_visible(), "ubah soal berhasil")

    # Setelah mengerjakan kuis, kunci soal yang dikerjakan terbuka
    page.goto(BASE + "/kuis/" + set_id)
    page.get_by_role("button", name="Mulai kuis").click()
    answered = play_quiz(page)
    page.goto(set_url)
    check(page.locator("summary", has_text="Lihat kunci").count() == answered,
          f"kunci terbuka untuk {answered} soal yang sudah dikerjakan")

    page.goto(class_url + "/pengaturan")
    check(page.get_by_text("Keluar dari kelas").first.is_visible(), "anggota hanya melihat opsi keluar kelas")
    page.goto(class_url + "/laporan")
    check(page.get_by_text("Halaman tidak ditemukan").is_visible(), "anggota tidak bisa membuka halaman laporan")

    # ---------- Pemilik kelas ----------
    ctx2 = browser.new_context(viewport={"width": 1366, "height": 860})
    pg = ctx2.new_page()
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(BASE + "/masuk")
    pg.fill("#email", "demo@kolabkuis.id")
    pg.fill("#password", "salah123")
    pg.click("button[type=submit]")
    pg.wait_for_timeout(1000)
    check(pg.get_by_text("Email atau kata sandi salah").is_visible(), "kata sandi salah ditolak")
    pg.fill("#password", "demo12345")
    pg.click("button[type=submit]")
    pg.wait_for_url("**/dashboard")

    pg.goto(set_url)
    check(pg.locator("summary", has_text="Lihat kunci").count() == pg.locator("article").count(), "pemilik kelas melihat semua kunci")

    pg.goto(BASE + "/kuis/" + set_id)
    pg.locator("label:has-text('5')").first.click()
    pg.get_by_role("button", name="Mulai kuis").click()
    pg.wait_for_selector("text=Soal 1 dari 5")
    html = pg.content()
    check("correctIndex" not in html and "explanation" not in html, "kunci jawaban tidak dikirim ke browser selama kuis")
    play_quiz(pg)
    result_url = pg.url
    check(pg.get_by_text("Kerjakan lagi").is_visible(), "halaman hasil kuis tampil")

    pg.goto(class_url + "/peringkat")
    check(pg.get_by_text("Papan peringkat").is_visible(), "papan peringkat tampil")
    dimas = pg.locator("li", has_text="Dimas Nugroho")
    check("0 soal ditulis" in dimas.inner_text(), "soal yang disembunyikan tidak memberi poin peringkat")
    pg.goto(class_url + "/anggota")
    check(pg.get_by_text("Penguji Satu").is_visible(), "anggota baru tercantum")
    pg.goto(class_url + "/laporan")
    check(pg.get_by_text("Kunci jawaban salah").is_visible(), "pemilik melihat laporan soal")

    pg.goto(set_url)
    pg.once("dialog", lambda d: d.accept())
    pg.locator("article", has_text="Notasi prefix").get_by_role("button", name="Hapus").click()
    pg.wait_for_timeout(1500)
    check(pg.get_by_text("Notasi prefix").count() == 0, "pemilik bisa menghapus soal anggota")

    pg.goto(class_url)
    pg.fill("#title", "Bab 7: Graph")
    pg.fill("#description", "BFS dan DFS")
    pg.get_by_role("button", name="Buat bank soal").click()
    pg.wait_for_url("**/bank/**")
    check(pg.get_by_text("Bank soal ini masih kosong").is_visible(), "buat bank soal berhasil")
    pg.locator("summary", has_text="Kelola bank soal").click()
    pg.fill("#title", "Bab 7: Graph dan traversal")
    pg.get_by_role("button", name="Simpan").click()
    pg.wait_for_timeout(1000)
    check(pg.get_by_text("Bab 7: Graph dan traversal").first.is_visible(), "ubah bank soal berhasil")
    pg.once("dialog", lambda d: d.accept())
    pg.get_by_role("button", name="Hapus bank soal").click()
    pg.wait_for_url(class_url)
    check(pg.get_by_text("Bab 7").count() == 0, "hapus bank soal berhasil")

    page.goto(result_url)
    check(page.get_by_text("Halaman tidak ditemukan").is_visible(), "hasil kuis pengguna lain tidak bisa dibuka")

    # ---------- Ponsel (390 px) ----------
    m = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    mp = m.new_page()
    mp.goto(BASE)
    mp.wait_for_load_state("networkidle")
    sw = mp.evaluate("document.documentElement.scrollWidth")
    check(sw <= 390, f"tidak ada scroll horizontal di landing page ponsel ({sw}px)")
    mp.goto(BASE + "/masuk")
    mp.fill("#email", "demo@kolabkuis.id")
    mp.fill("#password", "demo12345")
    mp.click("button[type=submit]")
    mp.wait_for_url("**/dashboard")
    mp.goto(set_url)
    check(mp.evaluate("document.documentElement.scrollWidth") <= 390, "tidak ada scroll horizontal di bank soal ponsel")
    shot(mp, "m-bank-soal", full=False)

    browser.close()
    check(not errors, f"tidak ada error JavaScript di browser {errors if errors else ''}")

failed = [m for ok, m in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} skenario lulus")
sys.exit(1 if failed else 0)
