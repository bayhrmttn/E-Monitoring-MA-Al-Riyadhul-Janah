// ================== STATE GLOBAL ==================
let siswaList = [], guruList = [], bukuList = [];
let absensiHarian = [], absensiGuruHarian = [];
let hafalanList = [], sholatList = [];
let absensiGuruList = [];
let hpList = [], kunjunganList = [], pinjamList = [];
let suratCustomList = [];

let modeAbsen = "masuk";     // masuk | pulang | pulangAwal
let jenisAbsen = "siswa";    // siswa | guru
let modeSholat = "dhuha";
let modeHP = "titip";        // titip | ambil
let perpusTab = "kunjungan"; // kunjungan | pinjam | kembali
let rekapTab = "absen";
let isAdminUnlocked = false;
let editingNis = null, editingGid = null, editingKodeBuku = null;

// ================== UTIL ==================
function todayStr(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function nowTime(){ return new Date().toTimeString().slice(0,5); }
function getSiswaByNIS(nis){ return siswaList.find(s => s.nis === nis); }
function getGuruByGID(gid){ return guruList.find(g => g.gid === gid); }
function getBukuByKode(kode){ return bukuList.find(b => b.kode === kode); }
function getPetugasAktif(){
  const g = JSON.parse(localStorage.getItem('guruPiketAktif'));
  if(g) return g.nama;
  if(isAdminUnlocked) return 'Admin';
  return 'Tidak diketahui';
}
function beep(sukses=true){
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.frequency.value = sukses ? 880 : 220;
    osc.connect(ctx.destination); osc.start(); setTimeout(()=>osc.stop(),150);
  }catch(e){}
}
function focusInput(id){ setTimeout(()=>{ const el=document.getElementById(id); if(el) el.focus(); }, 100); }

// ================== TEMA ==================
function applyTheme(theme){
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  document.getElementById('btnToggleTheme').innerText = theme === 'dark' ? '☀️ Mode Terang' : '🌙 Mode Gelap';
}
document.getElementById('btnToggleTheme').addEventListener('click', ()=>{
  const current = document.body.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ================== SINKRONISASI ==================
async function loadAllDataFromServer(){
  if(!APPS_SCRIPT_URL){
    siswaList         = JSON.parse(localStorage.getItem('siswaList'))         || DEFAULT_SISWA;
    guruList          = JSON.parse(localStorage.getItem('guruList'))          || DEFAULT_GURU;
    bukuList          = JSON.parse(localStorage.getItem('bukuList'))          || DEFAULT_BUKU;
    absensiHarian     = JSON.parse(localStorage.getItem('absensiHarian'))     || [];
    absensiGuruHarian = JSON.parse(localStorage.getItem('absensiGuruHarian')) || [];
    hafalanList       = JSON.parse(localStorage.getItem('hafalanList'))       || [];
    sholatList        = JSON.parse(localStorage.getItem('sholatList'))        || [];
    absensiGuruList   = JSON.parse(localStorage.getItem('absensiGuruList'))   || [];
    hpList            = JSON.parse(localStorage.getItem('hpList'))            || [];
    kunjunganList     = JSON.parse(localStorage.getItem('kunjunganList'))     || [];
    pinjamList        = JSON.parse(localStorage.getItem('pinjamList'))        || [];
    suratCustomList   = JSON.parse(localStorage.getItem('suratCustomList'))   || [];
    document.getElementById('syncStatus').innerText = '⚪ Mode Lokal';
    renderSemua(); return;
  }
  document.getElementById('syncStatus').innerText = '⏳ Menyinkronkan...';
  try{
    const res = await fetch(APPS_SCRIPT_URL + '?action=getAllData');
    const data = await res.json();
    siswaList         = (data.siswaList && data.siswaList.length) ? data.siswaList : DEFAULT_SISWA;
    guruList          = (data.guruList && data.guruList.length) ? data.guruList : DEFAULT_GURU;
    bukuList          = (data.bukuList && data.bukuList.length) ? data.bukuList : DEFAULT_BUKU;
    absensiHarian     = data.absensiHarian || [];
    absensiGuruHarian = data.absensiGuruHarian || [];
    hafalanList       = data.hafalanList || [];
    sholatList        = data.sholatList || [];
    absensiGuruList   = data.absensiGuruList || [];
    hpList            = data.hpList || [];
    kunjunganList     = data.kunjunganList || [];
    pinjamList        = data.pinjamList || [];
    suratCustomList   = data.suratCustomList || [];

    ['siswaList','guruList','bukuList','absensiHarian','absensiGuruHarian','hafalanList','sholatList','absensiGuruList','hpList','kunjunganList','pinjamList','suratCustomList'].forEach(k=>{
      localStorage.setItem(k, JSON.stringify(eval(k)));
    });
    document.getElementById('syncStatus').innerText = '🟢 Tersinkron: ' + new Date().toLocaleTimeString();
  }catch(err){
    console.error(err);
    siswaList = JSON.parse(localStorage.getItem('siswaList')) || DEFAULT_SISWA;
    guruList = JSON.parse(localStorage.getItem('guruList')) || DEFAULT_GURU;
    bukuList = JSON.parse(localStorage.getItem('bukuList')) || DEFAULT_BUKU;
    absensiHarian = JSON.parse(localStorage.getItem('absensiHarian')) || [];
    absensiGuruHarian = JSON.parse(localStorage.getItem('absensiGuruHarian')) || [];
    hafalanList = JSON.parse(localStorage.getItem('hafalanList')) || [];
    sholatList = JSON.parse(localStorage.getItem('sholatList')) || [];
    absensiGuruList = JSON.parse(localStorage.getItem('absensiGuruList')) || [];
    hpList = JSON.parse(localStorage.getItem('hpList')) || [];
    kunjunganList = JSON.parse(localStorage.getItem('kunjunganList')) || [];
    pinjamList = JSON.parse(localStorage.getItem('pinjamList')) || [];
    suratCustomList = JSON.parse(localStorage.getItem('suratCustomList')) || [];
    document.getElementById('syncStatus').innerText = '🔴 Offline (cache)';
  }
  renderSemua();
}

async function kirimKeServer(action, payload){
  if(!APPS_SCRIPT_URL) return;
  try{
    await fetch(APPS_SCRIPT_URL, {
      method:'POST', headers:{'Content-Type':'text/plain'},
      body: JSON.stringify({ action, ...payload })
    });
  }catch(err){ console.error('Gagal kirim:', err); }
}

function renderSemua(){
  renderDashboard();
  renderTabelAbsenHariIni(); renderTabelAbsenGuruHariIni();
  renderTabelHafalanHariIni(); renderTabelSholatHariIni();
  renderTabelHPHariIni(); renderTabelHPAktif();
  renderTabelKunjunganHariIni(); renderTabelPinjamHariIni(); renderTabelBukuDipinjam();
  renderFilterKelasOptions(); renderLaporanOptions();
  if(isAdminUnlocked){ renderTabelSiswa(); renderTabelGuru(); renderTabelBuku(); }
  renderRekap();
}

// ================== NAVIGASI ==================
document.querySelectorAll('.nav-item').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.getElementById('page-'+btn.dataset.page).classList.add('active');
    document.getElementById('pageTitle').innerText = btn.innerText.trim();
    document.getElementById('sidebar').classList.remove('open');
  });
});
document.getElementById('btnToggleSidebar').addEventListener('click', ()=> document.getElementById('sidebar').classList.toggle('open'));
document.getElementById('btnRefresh').addEventListener('click', loadAllDataFromServer);
function tickJam(){ document.getElementById('jamSekarang').innerText = new Date().toLocaleString('id-ID'); }
setInterval(tickJam, 1000);

// ================== MODE ADMIN ==================
['btnLoginAdmin','btnKeAdminDariSiswa','btnKeAdminDariGuru','btnKeAdminDariBuku'].forEach(id=>{
  document.getElementById(id).addEventListener('click', ()=> document.getElementById('modalAdminLogin').classList.remove('hidden'));
});
document.getElementById('btnBatalAdminLogin').addEventListener('click', ()=> document.getElementById('modalAdminLogin').classList.add('hidden'));
document.getElementById('btnSubmitAdminLogin').addEventListener('click', ()=>{
  const pin = document.getElementById('inputAdminPinModal').value;
  if(pin !== ADMIN_PIN){ alert('PIN salah!'); return; }
  isAdminUnlocked = true;
  localStorage.setItem('adminAktif','1');
  document.getElementById('inputAdminPinModal').value='';
  document.getElementById('modalAdminLogin').classList.add('hidden');
  renderAdminUI();
});
document.getElementById('btnLogoutAdmin').addEventListener('click', ()=>{
  isAdminUnlocked = false; localStorage.removeItem('adminAktif'); renderAdminUI();
});

function renderAdminUI(){
  document.getElementById('adminBelumLogin').classList.toggle('hidden', isAdminUnlocked);
  document.getElementById('adminSudahLogin').classList.toggle('hidden', !isAdminUnlocked);
  document.getElementById('siswaLocked').classList.toggle('hidden', isAdminUnlocked);
  document.getElementById('siswaUnlocked').classList.toggle('hidden', !isAdminUnlocked);
  document.getElementById('guruLocked').classList.toggle('hidden', isAdminUnlocked);
  document.getElementById('guruUnlocked').classList.toggle('hidden', !isAdminUnlocked);
  document.getElementById('bukuLocked').classList.toggle('hidden', isAdminUnlocked);
  document.getElementById('bukuUnlocked').classList.toggle('hidden', !isAdminUnlocked);
  if(isAdminUnlocked){ renderTabelSiswa(); renderTabelGuru(); renderTabelBuku(); }
  cekAksesPetugas();
}
function cekSesiAdmin(){ isAdminUnlocked = localStorage.getItem('adminAktif') === '1'; renderAdminUI(); }

// ================== DASHBOARD ==================
let chartMingguan = null;
function renderDashboard(){
  const today = todayStr();
  const absenHariIni = absensiHarian.filter(a=>a.tanggal===today);
  const stats = [
    { label:'Total Siswa', val: siswaList.length },
    { label:'Absen Masuk', val: absenHariIni.filter(a=>a.jamMasuk).length },
    { label:'Terlambat', val: absenHariIni.filter(a=>a.statusMasuk==='Terlambat').length },
    { label:'Absen Pulang', val: absenHariIni.filter(a=>a.jamPulang).length },
    { label:'Pulang Awal', val: absenHariIni.filter(a=>a.jenisPulangAwal).length },
    { label:'Setoran Hafalan', val: hafalanList.filter(h=>h.tanggal===today).length },
    { label:'Absen Dhuha', val: sholatList.filter(s=>s.tanggal===today && s.jenis==='Dhuha').length },
    { label:'Absen Dzuhur', val: sholatList.filter(s=>s.tanggal===today && s.jenis==='Dzuhur').length },
    { label:'HP Dititipkan', val: hpList.filter(h=>h.tanggal===today && !h.jamAmbil).length },
    { label:'Kunjungan Perpus', val: kunjunganList.filter(k=>k.tanggal===today).length },
    { label:'Buku Dipinjam', val: pinjamList.filter(p=>p.status==='Dipinjam').length },
    { label:'Guru Hadir', val: absensiGuruHarian.filter(a=>a.tanggal===today && a.jamMasuk).length },
  ];
  document.getElementById('statGrid').innerHTML = stats.map(s=>`<div class="stat-card"><h4>${s.label}</h4><div class="num">${s.val}</div></div>`).join('');

  const labels = [], dataMasuk = [], dataHafalan = [];
  for(let i=6;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const str = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    labels.push(d.toLocaleDateString('id-ID',{weekday:'short',day:'numeric'}));
    dataMasuk.push(absensiHarian.filter(a=>a.tanggal===str && a.jamMasuk).length);
    dataHafalan.push(hafalanList.filter(h=>h.tanggal===str).length);
  }
  const ctx = document.getElementById('chartMingguan').getContext('2d');
  if(chartMingguan) chartMingguan.destroy();
  chartMingguan = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[
      { label:'Absen Masuk', data:dataMasuk, borderColor:'#4f46e5', backgroundColor:'rgba(79,70,229,.15)', tension:.3, fill:true },
      { label:'Setoran Hafalan', data:dataHafalan, borderColor:'#f97316', backgroundColor:'rgba(249,115,22,.15)', tension:.3, fill:true }
    ]},
    options:{ responsive:true, plugins:{legend:{position:'bottom'}} }
  });

  const guruHariIni = absensiGuruList.filter(g=>g.tanggal===today);
  document.getElementById('guruPiketHariIni').innerHTML = guruHariIni.map(g=>`<div class="item"><strong>${g.jamLogin}</strong> — ${g.nama} login</div>`).join('') || '<p>Belum ada guru login hari ini.</p>';

  let aktivitas = [];
  absensiHarian.forEach(a=>{
    if(a.jamMasuk) aktivitas.push({waktu:a.tanggal+' '+a.jamMasuk, teks:`${a.nama} absen masuk (${a.statusMasuk})`});
    if(a.jamPulang) aktivitas.push({waktu:a.tanggal+' '+a.jamPulang, teks:`${a.nama} absen pulang`});
    if(a.jenisPulangAwal) aktivitas.push({waktu:a.tanggal+' '+(a.jamPulangAwal||''), teks:`⚠️ ${a.nama} pulang awal (${a.jenisPulangAwal})`});
  });
  hafalanList.forEach(h=> aktivitas.push({waktu:h.tanggal+' '+h.waktu, teks:`${h.nama} setor hafalan ${h.surat} (${h.predikat})`}));
  sholatList.forEach(s=> aktivitas.push({waktu:s.tanggal+' '+s.waktu, teks:`${s.nama} sholat ${s.jenis}`}));
  hpList.forEach(h=>{
    if(h.jamTitip) aktivitas.push({waktu:h.tanggal+' '+h.jamTitip, teks:`📱 ${h.nama} titip HP`});
    if(h.jamAmbil) aktivitas.push({waktu:h.tanggal+' '+h.jamAmbil, teks:`📱 ${h.nama} ambil HP`});
  });
  kunjunganList.forEach(k=> aktivitas.push({waktu:k.tanggal+' '+k.waktu, teks:`📚 ${k.nama} kunjungan perpus`}));
  pinjamList.forEach(p=>{
    aktivitas.push({waktu:p.tglPinjam+' '+p.jamPinjam, teks:`📥 ${p.nama} pinjam "${p.judul}"`});
    if(p.tglKembali) aktivitas.push({waktu:p.tglKembali+' '+(p.jamKembali||''), teks:`📤 ${p.nama} kembalikan "${p.judul}"`});
  });
  aktivitas.sort((a,b)=> b.waktu.localeCompare(a.waktu));
  document.getElementById('aktivitasTerbaru').innerHTML = aktivitas.slice(0,20).map(a=>`<div class="item"><strong>${a.waktu}</strong> — ${a.teks}</div>`).join('') || '<p>Belum ada aktivitas.</p>';
}

// ================== AKSES PETUGAS (ABSEN, HP, PERPUS) ==================
function cekAksesPetugas(){
  const g = JSON.parse(localStorage.getItem('guruPiketAktif'));
  const akses = isAdminUnlocked || !!g;
  const petugas = g ? g.nama : (isAdminUnlocked ? 'Admin' : '-');

  document.getElementById('absenLocked').classList.toggle('hidden', akses);
  document.getElementById('absenUnlocked').classList.toggle('hidden', !akses);
  document.getElementById('namaGuruPiketDiAbsen').innerText = petugas;

  document.getElementById('hpLocked').classList.toggle('hidden', akses);
  document.getElementById('hpUnlocked').classList.toggle('hidden', !akses);

  document.getElementById('perpusLocked').classList.toggle('hidden', akses);
  document.getElementById('perpusUnlocked').classList.toggle('hidden', !akses);
}
['btnKeLoginGuruDariAbsen','btnKeLoginGuruDariHP','btnKeLoginGuruDariPerpus'].forEach(id=>{
  document.getElementById(id).addEventListener('click', ()=> document.getElementById('modalGuruPiket').classList.remove('hidden'));
});

// ================== KAMERA SCAN (SUPPORT CONTINUOUS) ==================
let html5QrCode = null;
let kameraTargetInput = null;
let kameraKontinu = false;
let lastScanTime = 0;
let lastScanValue = '';

function bukaKamera(targetInputId, kontinu=false){
  kameraTargetInput = targetInputId;
  kameraKontinu = kontinu;
  document.getElementById('judulKamera').innerText = kontinu ? '📷 Scan Kontinu (Kamera tetap aktif)' : '📷 Scan via Kamera';
  document.getElementById('statusKameraKontinu').innerText = kontinu ? '✅ Mode kontinu aktif — scan satu per satu, kamera tidak tutup otomatis.' : '';
  document.getElementById('modalKamera').classList.remove('hidden');
  html5QrCode = new Html5Qrcode("readerKamera");
  html5QrCode.start({facingMode:"environment"}, {fps:10, qrbox:220}, (text)=>{
    const now = Date.now();
    if(text === lastScanValue && (now - lastScanTime) < 2000) return; // debounce
    lastScanValue = text; lastScanTime = now;

    const input = document.getElementById(kameraTargetInput);
    input.value = text;
    const ev = new KeyboardEvent('keypress', {key:'Enter'});
    input.dispatchEvent(ev);

    if(kameraKontinu){
      beep(true);
      document.getElementById('statusKameraKontinu').innerText = `✅ Terbaca: ${text} — siap scan berikutnya...`;
    } else {
      tutupKamera();
    }
  }).catch(err=> console.error(err));
}
function tutupKamera(){
  if(html5QrCode){ html5QrCode.stop().then(()=>html5QrCode.clear()).catch(()=>{}); html5QrCode = null; }
  document.getElementById('modalKamera').classList.add('hidden');
  lastScanValue = ''; lastScanTime = 0;
}
document.getElementById('btnTutupKamera').addEventListener('click', tutupKamera);

// Scanner USB: setelah Enter, langsung auto-focus kembali
function setupAutoRefocus(inputId){
  const el = document.getElementById(inputId);
  el.addEventListener('keypress', e=>{
    if(e.key==='Enter'){ setTimeout(()=>el.focus(), 150); }
  });
}
['inputScanAbsen','inputScanHP','inputScanKunjungan','inputScanPinjam','inputScanKembali','inputScanHafalan','inputScanSholat','gpBarcodeInput'].forEach(setupAutoRefocus);

// ================== ABSEN MASUK/PULANG ==================
document.getElementById('btnJenisAbsenSiswa').addEventListener('click', ()=>{
  jenisAbsen='siswa';
  document.getElementById('btnJenisAbsenSiswa').classList.add('active');
  document.getElementById('btnJenisAbsenGuru').classList.remove('active');
  document.getElementById('tabelAbsenSiswaWrap').classList.remove('hidden');
  document.getElementById('tabelAbsenGuruWrap').classList.add('hidden');
  updateLabelScanAbsen(); focusInput('inputScanAbsen');
});
document.getElementById('btnJenisAbsenGuru').addEventListener('click', ()=>{
  jenisAbsen='guru';
  document.getElementById('btnJenisAbsenGuru').classList.add('active');
  document.getElementById('btnJenisAbsenSiswa').classList.remove('active');
  document.getElementById('tabelAbsenGuruWrap').classList.remove('hidden');
  document.getElementById('tabelAbsenSiswaWrap').classList.add('hidden');
  updateLabelScanAbsen(); focusInput('inputScanAbsen');
});

function setModeAbsen(mode){
  modeAbsen = mode;
  document.getElementById('btnModeMasuk').classList.toggle('active', mode==='masuk');
  document.getElementById('btnModePulang').classList.toggle('active', mode==='pulang');
  document.getElementById('btnModePulangAwal').classList.toggle('active', mode==='pulangAwal');
  updateLabelScanAbsen();
}
document.getElementById('btnModeMasuk').addEventListener('click', ()=> setModeAbsen('masuk'));
document.getElementById('btnModePulang').addEventListener('click', ()=> setModeAbsen('pulang'));
document.getElementById('btnModePulangAwal').addEventListener('click', ()=> setModeAbsen('pulangAwal'));

function updateLabelScanAbsen(){
  const target = jenisAbsen==='siswa' ? 'Siswa' : 'Guru';
  let aksi = 'Masuk';
  if(modeAbsen==='pulang') aksi='Pulang';
  else if(modeAbsen==='pulangAwal') aksi='Pulang Awal (Izin/Sakit)';
  document.getElementById('labelScanAbsen').innerText = `Scan Kartu ${target} untuk Absen ${aksi}`;
}

document.getElementById('inputScanAbsen').addEventListener('keypress', e=>{
  if(e.key==='Enter'){
    const kode = e.target.value.trim();
    e.target.value='';
    if(!kode) return;
    if(jenisAbsen==='siswa') prosesScanAbsen(kode);
    else prosesScanAbsenGuru(kode);
  }
});

async function prosesScanAbsen(nis){
  const fb = document.getElementById('feedbackAbsen');
  const siswa = getSiswaByNIS(nis);
  if(!siswa){ fb.className='scan-feedback error'; fb.innerText='❌ NIS tidak ditemukan: '+nis; beep(false); return; }

  const today = todayStr();
  let rec = absensiHarian.find(a=>a.nis===nis && a.tanggal===today);

  if(modeAbsen==='masuk'){
    if(rec && rec.jamMasuk){ fb.className='scan-feedback error'; fb.innerText=`⚠️ ${siswa.nama} sudah absen masuk.`; beep(false); return; }
    const jam = nowTime();
    const status = jam > APP_CONFIG.jamMasukBatas ? 'Terlambat' : 'Tepat Waktu';
    if(!rec){ rec = { nis, nama:siswa.nama, kelas:siswa.kelas, tanggal:today, jamMasuk:jam, statusMasuk:status, jamPulang:'', jenisPulangAwal:'', jamPulangAwal:'', ketPulangAwal:'' }; absensiHarian.push(rec); }
    else { rec.jamMasuk=jam; rec.statusMasuk=status; }
    fb.className='scan-feedback success'; fb.innerText=`✅ ${siswa.nama} - Absen Masuk (${status}) jam ${jam}`;
    beep(true);
    kirimKeServer('saveAbsensi', rec);
  } else if(modeAbsen==='pulang'){
    if(!rec || !rec.jamMasuk){ fb.className='scan-feedback error'; fb.innerText=`⚠️ ${siswa.nama} belum absen masuk.`; beep(false); return; }
    if(rec.jamPulang){ fb.className='scan-feedback error'; fb.innerText=`⚠️ ${siswa.nama} sudah absen pulang.`; beep(false); return; }
    rec.jamPulang = nowTime();
    fb.className='scan-feedback success'; fb.innerText=`✅ ${siswa.nama} - Absen Pulang jam ${rec.jamPulang}`;
    beep(true);
    kirimKeServer('saveAbsensi', rec);
  } else if(modeAbsen==='pulangAwal'){
    // buka modal
    document.getElementById('infoSiswaPulangAwal').innerText = `${siswa.nama} - NIS ${siswa.nis} - Kelas ${siswa.kelas}`;
    document.getElementById('pulangAwalNis').value = siswa.nis;
    document.getElementById('pulangAwalKet').value = '';
    document.getElementById('modalPulangAwal').classList.remove('hidden');
    beep(true); return;
  }
  localStorage.setItem('absensiHarian', JSON.stringify(absensiHarian));
  renderDashboard(); renderTabelAbsenHariIni();
}

document.getElementById('btnBatalPulangAwal').addEventListener('click', ()=>{
  document.getElementById('modalPulangAwal').classList.add('hidden');
  focusInput('inputScanAbsen');
});
document.getElementById('btnSimpanPulangAwal').addEventListener('click', async ()=>{
  const nis = document.getElementById('pulangAwalNis').value;
  const siswa = getSiswaByNIS(nis);
  const today = todayStr();
  let rec = absensiHarian.find(a=>a.nis===nis && a.tanggal===today);
  if(!rec){
    rec = { nis, nama:siswa.nama, kelas:siswa.kelas, tanggal:today, jamMasuk:'', statusMasuk:'', jamPulang:'', jenisPulangAwal:'', jamPulangAwal:'', ketPulangAwal:'' };
    absensiHarian.push(rec);
  }
  rec.jenisPulangAwal = document.getElementById('pulangAwalJenis').value;
  rec.jamPulangAwal = nowTime();
  rec.ketPulangAwal = document.getElementById('pulangAwalKet').value;
  localStorage.setItem('absensiHarian', JSON.stringify(absensiHarian));
  document.getElementById('modalPulangAwal').classList.add('hidden');
  const fb = document.getElementById('feedbackAbsen');
  fb.className='scan-feedback success';
  fb.innerText = `✅ ${siswa.nama} - Pulang Awal (${rec.jenisPulangAwal}) tercatat jam ${rec.jamPulangAwal}`;
  renderDashboard(); renderTabelAbsenHariIni();
  await kirimKeServer('saveAbsensi', rec);
  focusInput('inputScanAbsen');
});

function renderTabelAbsenHariIni(){
  const today = todayStr();
  const data = absensiHarian.filter(a=>a.tanggal===today);
  document.getElementById('tabelAbsenHariIni').innerHTML = `<tr><th>NIS</th><th>Nama</th><th>Kelas</th><th>Masuk</th><th>Status</th><th>Pulang</th><th>Pulang Awal</th></tr>` +
    data.map(a=>{
      let pa = '-';
      if(a.jenisPulangAwal) pa = `<span class="badge-status badge-izin">${a.jenisPulangAwal}</span> ${a.jamPulangAwal||''}${a.ketPulangAwal?' - '+a.ketPulangAwal:''}`;
      return `<tr><td>${a.nis}</td><td>${a.nama}</td><td>${a.kelas}</td><td>${a.jamMasuk||'-'}</td><td>${a.statusMasuk||'-'}</td><td>${a.jamPulang||'-'}</td><td>${pa}</td></tr>`;
    }).join('');
}

async function prosesScanAbsenGuru(gid){
  const fb = document.getElementById('feedbackAbsen');
  const guru = getGuruByGID(gid);
  if(!guru){ fb.className='scan-feedback error'; fb.innerText='❌ Kode guru tidak ditemukan.'; beep(false); return; }
  const today = todayStr();
  let rec = absensiGuruHarian.find(a=>a.gid===gid && a.tanggal===today);

  if(modeAbsen==='masuk'){
    if(rec && rec.jamMasuk){ fb.className='scan-feedback error'; fb.innerText=`⚠️ ${guru.nama} sudah absen masuk.`; beep(false); return; }
    const jam = nowTime();
    const status = jam > APP_CONFIG.jamMasukBatas ? 'Terlambat' : 'Tepat Waktu';
    if(!rec){ rec = { gid, nama:guru.nama, jabatan:guru.jabatan, tanggal:today, jamMasuk:jam, statusMasuk:status, jamPulang:'' }; absensiGuruHarian.push(rec); }
    else { rec.jamMasuk=jam; rec.statusMasuk=status; }
    fb.className='scan-feedback success'; fb.innerText=`✅ ${guru.nama} - Absen Masuk (${status}) jam ${jam}`;
    beep(true);
    kirimKeServer('saveAbsensiGuruHarian', rec);
  } else if(modeAbsen==='pulang'){
    if(!rec || !rec.jamMasuk){ fb.className='scan-feedback error'; fb.innerText=`⚠️ ${guru.nama} belum absen masuk.`; beep(false); return; }
    if(rec.jamPulang){ fb.className='scan-feedback error'; fb.innerText=`⚠️ ${guru.nama} sudah absen pulang.`; beep(false); return; }
    rec.jamPulang = nowTime();
    fb.className='scan-feedback success'; fb.innerText=`✅ ${guru.nama} - Absen Pulang jam ${rec.jamPulang}`;
    beep(true);
    kirimKeServer('saveAbsensiGuruHarian', rec);
  }
  localStorage.setItem('absensiGuruHarian', JSON.stringify(absensiGuruHarian));
  renderDashboard(); renderTabelAbsenGuruHariIni();
}

function renderTabelAbsenGuruHariIni(){
  const today = todayStr();
  const data = absensiGuruHarian.filter(a=>a.tanggal===today);
  document.getElementById('tabelAbsenGuruHariIni').innerHTML = `<tr><th>GID</th><th>Nama</th><th>Jabatan</th><th>Masuk</th><th>Status</th><th>Pulang</th></tr>` +
    data.map(a=>`<tr><td>${a.gid}</td><td>${a.nama}</td><td>${a.jabatan}</td><td>${a.jamMasuk||'-'}</td><td>${a.statusMasuk||'-'}</td><td>${a.jamPulang||'-'}</td></tr>`).join('');
}

document.getElementById('btnKameraAbsen').addEventListener('click', ()=>{
  bukaKamera('inputScanAbsen', true);
  document.getElementById('btnStopKameraAbsen').classList.remove('hidden');
});
document.getElementById('btnStopKameraAbsen').addEventListener('click', ()=>{
  tutupKamera();
  document.getElementById('btnStopKameraAbsen').classList.add('hidden');
});

// ================== HAFALAN (dengan + Tambah Surat Baru) ==================
document.getElementById('inputScanHafalan').addEventListener('keypress', e=>{
  if(e.key==='Enter'){
    const nis = e.target.value.trim(); e.target.value='';
    const siswa = getSiswaByNIS(nis);
    const fb = document.getElementById('feedbackHafalan');
    if(!siswa){ fb.className='scan-feedback error'; fb.innerText='❌ NIS tidak ditemukan.'; beep(false); return; }
    fb.className='scan-feedback success'; fb.innerText=`Kartu terbaca: ${siswa.nama}`;
    bukaModalHafalan(siswa);
  }
});
document.getElementById('btnKameraHafalan').addEventListener('click', ()=> bukaKamera('inputScanHafalan', false));

function bukaModalHafalan(siswa){
  document.getElementById('infoSiswaHafalan').innerText = `${siswa.nama} - NIS ${siswa.nis} - Kelas ${siswa.kelas}`;
  document.getElementById('hafalanNis').value = siswa.nis;
  updateOpsiSurat();
  document.getElementById('modalHafalan').classList.remove('hidden');
}
document.getElementById('hafalanJenis').addEventListener('change', updateOpsiSurat);
document.getElementById('hafalanSurat').addEventListener('change', e=>{
  if(e.target.value === '__TAMBAH__'){
    document.getElementById('inputSuratBaru').value = '';
    document.getElementById('modalSuratBaru').classList.remove('hidden');
  }
});

function updateOpsiSurat(){
  const jenis = document.getElementById('hafalanJenis').value;
  let list;
  if(jenis==='Juz 30') list = JUZ30_LIST;
  else list = [...SURAT_PILIHAN_LIST, ...suratCustomList];
  const options = list.map(s=>`<option>${s}</option>`).join('') + '<option value="__TAMBAH__">➕ Tambah surat baru...</option>';
  document.getElementById('hafalanSurat').innerHTML = options;
}

document.getElementById('btnBatalSuratBaru').addEventListener('click', ()=>{
  document.getElementById('modalSuratBaru').classList.add('hidden');
  document.getElementById('hafalanSurat').selectedIndex = 0;
});
document.getElementById('btnSimpanSuratBaru').addEventListener('click', async ()=>{
  const nama = document.getElementById('inputSuratBaru').value.trim();
  if(!nama){ alert('Nama surat tidak boleh kosong.'); return; }
  if(JUZ30_LIST.includes(nama) || SURAT_PILIHAN_LIST.includes(nama) || suratCustomList.includes(nama)){ alert('Surat ini sudah ada.'); return; }
  suratCustomList.push(nama);
  localStorage.setItem('suratCustomList', JSON.stringify(suratCustomList));
  document.getElementById('modalSuratBaru').classList.add('hidden');
  updateOpsiSurat();
  document.getElementById('hafalanSurat').value = nama;
  await kirimKeServer('saveSuratCustom', {nama});
});

document.getElementById('btnBatalHafalan').addEventListener('click', ()=> document.getElementById('modalHafalan').classList.add('hidden'));
document.getElementById('btnSimpanHafalan').addEventListener('click', async ()=>{
  const nis = document.getElementById('hafalanNis').value;
  const siswa = getSiswaByNIS(nis);
  const surat = document.getElementById('hafalanSurat').value;
  if(surat === '__TAMBAH__'){ alert('Pilih surat dulu.'); return; }
  const rec = {
    nis, nama:siswa.nama, kelas:siswa.kelas, tanggal:todayStr(), waktu:nowTime(),
    jenis: document.getElementById('hafalanJenis').value, surat,
    predikat: document.getElementById('hafalanPredikat').value,
    catatan: document.getElementById('hafalanCatatan').value,
    dicatatOleh: getPetugasAktif()
  };
  hafalanList.push(rec);
  localStorage.setItem('hafalanList', JSON.stringify(hafalanList));
  document.getElementById('modalHafalan').classList.add('hidden');
  document.getElementById('hafalanCatatan').value='';
  renderDashboard(); renderTabelHafalanHariIni();
  await kirimKeServer('saveHafalan', rec);
});

function renderTabelHafalanHariIni(){
  const today = todayStr();
  const data = hafalanList.filter(h=>h.tanggal===today);
  document.getElementById('tabelHafalanHariIni').innerHTML = `<tr><th>NIS</th><th>Nama</th><th>Jenis</th><th>Surat</th><th>Predikat</th><th>Dicatat</th><th>Waktu</th></tr>` +
    data.map(h=>`<tr><td>${h.nis}</td><td>${h.nama}</td><td>${h.jenis}</td><td>${h.surat}</td><td>${h.predikat}</td><td>${h.dicatatOleh||'-'}</td><td>${h.waktu}</td></tr>`).join('');
}

// ================== SHOLAT ==================
document.getElementById('btnModeDhuha').addEventListener('click', ()=>{
  modeSholat='dhuha';
  document.getElementById('btnModeDhuha').classList.add('active');
  document.getElementById('btnModeDzuhur').classList.remove('active');
  document.getElementById('labelScanSholat').innerText='Scan Kartu untuk Absen Sholat Dhuha';
});
document.getElementById('btnModeDzuhur').addEventListener('click', ()=>{
  modeSholat='dzuhur';
  document.getElementById('btnModeDzuhur').classList.add('active');
  document.getElementById('btnModeDhuha').classList.remove('active');
  document.getElementById('labelScanSholat').innerText='Scan Kartu untuk Absen Sholat Dzuhur';
});
document.getElementById('inputScanSholat').addEventListener('keypress', e=>{
  if(e.key==='Enter'){ const nis=e.target.value.trim(); e.target.value=''; if(nis) prosesScanSholat(nis); }
});
document.getElementById('btnKameraSholat').addEventListener('click', ()=> bukaKamera('inputScanSholat', false));

async function prosesScanSholat(nis){
  const fb = document.getElementById('feedbackSholat');
  const siswa = getSiswaByNIS(nis);
  if(!siswa){ fb.className='scan-feedback error'; fb.innerText='❌ NIS tidak ditemukan.'; beep(false); return; }
  const today = todayStr();
  const jenis = modeSholat==='dhuha' ? 'Dhuha' : 'Dzuhur';
  if(sholatList.find(s=>s.nis===nis && s.tanggal===today && s.jenis===jenis)){
    fb.className='scan-feedback error'; fb.innerText=`⚠️ ${siswa.nama} sudah absen ${jenis}.`; beep(false); return;
  }
  const rec = { nis, nama:siswa.nama, kelas:siswa.kelas, tanggal:today, jenis, waktu:nowTime(), status:'Hadir', dicatatOleh:getPetugasAktif() };
  sholatList.push(rec);
  localStorage.setItem('sholatList', JSON.stringify(sholatList));
  fb.className='scan-feedback success'; fb.innerText=`✅ ${siswa.nama} - Sholat ${jenis} jam ${rec.waktu}`;
  beep(true);
  renderDashboard(); renderTabelSholatHariIni();
  await kirimKeServer('saveSholat', rec);
}
function renderTabelSholatHariIni(){
  const today = todayStr();
  const data = sholatList.filter(s=>s.tanggal===today);
  document.getElementById('tabelSholatHariIni').innerHTML = `<tr><th>NIS</th><th>Nama</th><th>Jenis</th><th>Dicatat</th><th>Waktu</th></tr>` +
    data.map(s=>`<tr><td>${s.nis}</td><td>${s.nama}</td><td>${s.jenis}</td><td>${s.dicatatOleh||'-'}</td><td>${s.waktu}</td></tr>`).join('');
}

// ================== PENITIPAN HP ==================
document.getElementById('btnModeTitipHP').addEventListener('click', ()=>{
  modeHP='titip';
  document.getElementById('btnModeTitipHP').classList.add('active');
  document.getElementById('btnModeAmbilHP').classList.remove('active');
  document.getElementById('labelScanHP').innerText='Scan Kartu untuk Titip HP';
  focusInput('inputScanHP');
});
document.getElementById('btnModeAmbilHP').addEventListener('click', ()=>{
  modeHP='ambil';
  document.getElementById('btnModeAmbilHP').classList.add('active');
  document.getElementById('btnModeTitipHP').classList.remove('active');
  document.getElementById('labelScanHP').innerText='Scan Kartu untuk Ambil HP';
  focusInput('inputScanHP');
});
document.getElementById('inputScanHP').addEventListener('keypress', e=>{
  if(e.key==='Enter'){ const nis=e.target.value.trim(); e.target.value=''; if(nis) prosesScanHP(nis); }
});
document.getElementById('btnKameraHP').addEventListener('click', ()=>{
  bukaKamera('inputScanHP', true);
  document.getElementById('btnStopKameraHP').classList.remove('hidden');
});
document.getElementById('btnStopKameraHP').addEventListener('click', ()=>{
  tutupKamera();
  document.getElementById('btnStopKameraHP').classList.add('hidden');
});

async function prosesScanHP(nis){
  const fb = document.getElementById('feedbackHP');
  const siswa = getSiswaByNIS(nis);
  if(!siswa){ fb.className='scan-feedback error'; fb.innerText='❌ NIS tidak ditemukan.'; beep(false); return; }
  const today = todayStr();
  let rec = hpList.find(h=>h.nis===nis && h.tanggal===today && !h.jamAmbil);

  if(modeHP==='titip'){
    if(rec){ fb.className='scan-feedback error'; fb.innerText=`⚠️ HP ${siswa.nama} masih tersimpan (belum diambil).`; beep(false); return; }
    rec = { id:'HP'+Date.now(), nis, nama:siswa.nama, kelas:siswa.kelas, tanggal:today, jamTitip:nowTime(), jamAmbil:'', petugasTitip:getPetugasAktif(), petugasAmbil:'' };
    hpList.push(rec);
    fb.className='scan-feedback success'; fb.innerText=`✅ HP ${siswa.nama} dititipkan jam ${rec.jamTitip}`;
    beep(true);
    await kirimKeServer('saveHP', rec);
  } else {
    if(!rec){ fb.className='scan-feedback error'; fb.innerText=`⚠️ Tidak ada HP ${siswa.nama} yang dititipkan hari ini.`; beep(false); return; }
    rec.jamAmbil = nowTime();
    rec.petugasAmbil = getPetugasAktif();
    fb.className='scan-feedback success'; fb.innerText=`✅ HP ${siswa.nama} diambil jam ${rec.jamAmbil}`;
    beep(true);
    await kirimKeServer('saveHP', rec);
  }
  localStorage.setItem('hpList', JSON.stringify(hpList));
  renderDashboard(); renderTabelHPHariIni(); renderTabelHPAktif();
}

function renderTabelHPHariIni(){
  const today = todayStr();
  const data = hpList.filter(h=>h.tanggal===today);
  document.getElementById('tabelHPHariIni').innerHTML = `<tr><th>NIS</th><th>Nama</th><th>Kelas</th><th>Titip</th><th>Ambil</th><th>Status</th></tr>` +
    data.map(h=>`<tr><td>${h.nis}</td><td>${h.nama}</td><td>${h.kelas}</td><td>${h.jamTitip||'-'}</td><td>${h.jamAmbil||'-'}</td><td>${h.jamAmbil?'<span class="badge-status badge-kembali">Sudah Diambil</span>':'<span class="badge-status badge-dipinjam">Masih Dititipkan</span>'}</td></tr>`).join('');
}
function renderTabelHPAktif(){
  const today = todayStr();
  const data = hpList.filter(h=>h.tanggal===today && !h.jamAmbil);
  document.getElementById('tabelHPAktif').innerHTML = `<tr><th>NIS</th><th>Nama</th><th>Kelas</th><th>Jam Titip</th></tr>` +
    (data.length ? data.map(h=>`<tr><td>${h.nis}</td><td>${h.nama}</td><td>${h.kelas}</td><td>${h.jamTitip}</td></tr>`).join('') : '<tr><td colspan="4">Tidak ada HP yang sedang dititipkan.</td></tr>');
}

// ================== PERPUSTAKAAN ==================
function setPerpusTab(tab){
  perpusTab = tab;
  document.getElementById('btnTabKunjungan').classList.toggle('active', tab==='kunjungan');
  document.getElementById('btnTabPinjam').classList.toggle('active', tab==='pinjam');
  document.getElementById('btnTabKembali').classList.toggle('active', tab==='kembali');
  document.getElementById('perpusKunjunganBox').classList.toggle('hidden', tab!=='kunjungan');
  document.getElementById('perpusPinjamBox').classList.toggle('hidden', tab!=='pinjam');
  document.getElementById('perpusKembaliBox').classList.toggle('hidden', tab!=='kembali');
  if(tab==='kunjungan') focusInput('inputScanKunjungan');
  if(tab==='pinjam') focusInput('inputScanPinjam');
  if(tab==='kembali') focusInput('inputScanKembali');
}
document.getElementById('btnTabKunjungan').addEventListener('click', ()=> setPerpusTab('kunjungan'));
document.getElementById('btnTabPinjam').addEventListener('click', ()=> setPerpusTab('pinjam'));
document.getElementById('btnTabKembali').addEventListener('click', ()=> setPerpusTab('kembali'));

// --- Kunjungan Perpus ---
document.getElementById('inputScanKunjungan').addEventListener('keypress', e=>{
  if(e.key==='Enter'){ const nis=e.target.value.trim(); e.target.value=''; if(nis) prosesKunjungan(nis); }
});
document.getElementById('btnKameraKunjungan').addEventListener('click', ()=>{
  bukaKamera('inputScanKunjungan', true);
  document.getElementById('btnStopKameraKunjungan').classList.remove('hidden');
});
document.getElementById('btnStopKameraKunjungan').addEventListener('click', ()=>{
  tutupKamera();
  document.getElementById('btnStopKameraKunjungan').classList.add('hidden');
});

async function prosesKunjungan(nis){
  const fb = document.getElementById('feedbackKunjungan');
  const siswa = getSiswaByNIS(nis);
  if(!siswa){ fb.className='scan-feedback error'; fb.innerText='❌ NIS tidak ditemukan.'; beep(false); return; }
  const today = todayStr();
  if(kunjunganList.find(k=>k.nis===nis && k.tanggal===today)){
    fb.className='scan-feedback error'; fb.innerText=`⚠️ ${siswa.nama} sudah tercatat kunjungan hari ini.`; beep(false); return;
  }
  const rec = { nis, nama:siswa.nama, kelas:siswa.kelas, tanggal:today, waktu:nowTime(), petugas:getPetugasAktif() };
  kunjunganList.push(rec);
  localStorage.setItem('kunjunganList', JSON.stringify(kunjunganList));
  fb.className='scan-feedback success'; fb.innerText=`✅ ${siswa.nama} - Kunjungan tercatat jam ${rec.waktu}`;
  beep(true);
  renderDashboard(); renderTabelKunjunganHariIni();
  await kirimKeServer('saveKunjungan', rec);
}
function renderTabelKunjunganHariIni(){
  const today = todayStr();
  const data = kunjunganList.filter(k=>k.tanggal===today);
  document.getElementById('tabelKunjunganHariIni').innerHTML = `<tr><th>NIS</th><th>Nama</th><th>Kelas</th><th>Waktu</th></tr>` +
    data.map(k=>`<tr><td>${k.nis}</td><td>${k.nama}</td><td>${k.kelas}</td><td>${k.waktu}</td></tr>`).join('');
}

// --- Peminjaman Buku ---
document.getElementById('inputScanPinjam').addEventListener('keypress', e=>{
  if(e.key==='Enter'){ const nis=e.target.value.trim(); e.target.value=''; if(nis) bukaModalPinjam(nis); }
});
document.getElementById('btnKameraPinjam').addEventListener('click', ()=> bukaKamera('inputScanPinjam', false));

function bukaModalPinjam(nis){
  const fb = document.getElementById('feedbackPinjam');
  const siswa = getSiswaByNIS(nis);
  if(!siswa){ fb.className='scan-feedback error'; fb.innerText='❌ NIS tidak ditemukan.'; beep(false); return; }
  fb.className='scan-feedback success'; fb.innerText=`Kartu terbaca: ${siswa.nama}`;
  document.getElementById('infoSiswaPinjam').innerText = `${siswa.nama} - NIS ${siswa.nis} - Kelas ${siswa.kelas}`;
  document.getElementById('pinjamNis').value = siswa.nis;
  document.getElementById('pinjamKodeBuku').innerHTML = bukuList.map(b=>`<option value="${b.kode}">${b.kode} - ${b.judul} (${b.penulis})</option>`).join('');
  document.getElementById('pinjamCatatan').value='';
  document.getElementById('modalPinjamBuku').classList.remove('hidden');
}
document.getElementById('btnBatalPinjam').addEventListener('click', ()=> document.getElementById('modalPinjamBuku').classList.add('hidden'));
document.getElementById('btnSimpanPinjam').addEventListener('click', async ()=>{
  const nis = document.getElementById('pinjamNis').value;
  const siswa = getSiswaByNIS(nis);
  const kode = document.getElementById('pinjamKodeBuku').value;
  const buku = getBukuByKode(kode);
  if(!buku){ alert('Buku tidak ditemukan.'); return; }
  const rec = {
    id: 'PJ'+Date.now(), nis, nama:siswa.nama, kelas:siswa.kelas,
    kodeBuku:kode, judul:buku.judul, tglPinjam:todayStr(), jamPinjam:nowTime(),
    tglKembali:'', jamKembali:'', status:'Dipinjam',
    catatan: document.getElementById('pinjamCatatan').value,
    petugasPinjam: getPetugasAktif(), petugasKembali:''
  };
  pinjamList.push(rec);
  localStorage.setItem('pinjamList', JSON.stringify(pinjamList));
  document.getElementById('modalPinjamBuku').classList.add('hidden');
  renderDashboard(); renderTabelPinjamHariIni(); renderTabelBukuDipinjam();
  await kirimKeServer('savePinjam', rec);
});
function renderTabelPinjamHariIni(){
  const today = todayStr();
  const data = pinjamList.filter(p=>p.tglPinjam===today);
  document.getElementById('tabelPinjamHariIni').innerHTML = `<tr><th>Nama</th><th>Kelas</th><th>Buku</th><th>Jam Pinjam</th><th>Status</th></tr>` +
    data.map(p=>`<tr><td>${p.nama}</td><td>${p.kelas}</td><td>${p.judul}</td><td>${p.jamPinjam}</td><td>${p.status==='Dipinjam'?'<span class="badge-status badge-dipinjam">Dipinjam</span>':'<span class="badge-status badge-kembali">Dikembalikan</span>'}</td></tr>`).join('');
}

// --- Pengembalian Buku ---
document.getElementById('inputScanKembali').addEventListener('keypress', e=>{
  if(e.key==='Enter'){ const nis=e.target.value.trim(); e.target.value=''; if(nis) bukaModalKembali(nis); }
});
document.getElementById('btnKameraKembali').addEventListener('click', ()=> bukaKamera('inputScanKembali', false));

function bukaModalKembali(nis){
  const fb = document.getElementById('feedbackKembali');
  const siswa = getSiswaByNIS(nis);
  if(!siswa){ fb.className='scan-feedback error'; fb.innerText='❌ NIS tidak ditemukan.'; beep(false); return; }
  const dipinjam = pinjamList.filter(p=>p.nis===nis && p.status==='Dipinjam');
  if(dipinjam.length===0){ fb.className='scan-feedback error'; fb.innerText=`⚠️ ${siswa.nama} tidak sedang meminjam buku.`; beep(false); return; }
  fb.className='scan-feedback success'; fb.innerText=`Kartu terbaca: ${siswa.nama}`;
  document.getElementById('infoSiswaKembali').innerText = `${siswa.nama} - ${dipinjam.length} buku dipinjam`;
  document.getElementById('daftarBukuDipinjamSiswa').innerHTML = dipinjam.map(p=>`
    <div class="item-buku-dipinjam">
      <div><strong>${p.judul}</strong><br><small>Dipinjam: ${p.tglPinjam} ${p.jamPinjam}</small></div>
      <button class="btn-primary" onclick="kembalikanBuku('${p.id}')">✅ Kembalikan</button>
    </div>
  `).join('');
  document.getElementById('modalKembaliBuku').classList.remove('hidden');
}
document.getElementById('btnBatalKembali').addEventListener('click', ()=>{
  document.getElementById('modalKembaliBuku').classList.add('hidden');
  focusInput('inputScanKembali');
});

async function kembalikanBuku(idPinjam){
  const rec = pinjamList.find(p=>p.id===idPinjam);
  if(!rec) return;
  rec.tglKembali = todayStr();
  rec.jamKembali = nowTime();
  rec.status = 'Dikembalikan';
  rec.petugasKembali = getPetugasAktif();
  localStorage.setItem('pinjamList', JSON.stringify(pinjamList));
  document.getElementById('modalKembaliBuku').classList.add('hidden');
  beep(true);
  renderDashboard(); renderTabelPinjamHariIni(); renderTabelBukuDipinjam();
  await kirimKeServer('savePinjam', rec);
  focusInput('inputScanKembali');
}

function renderTabelBukuDipinjam(){
  const data = pinjamList.filter(p=>p.status==='Dipinjam');
  document.getElementById('tabelBukuDipinjam').innerHTML = `<tr><th>Nama</th><th>Kelas</th><th>Buku</th><th>Tgl Pinjam</th></tr>` +
    (data.length ? data.map(p=>`<tr><td>${p.nama}</td><td>${p.kelas}</td><td>${p.judul}</td><td>${p.tglPinjam} ${p.jamPinjam}</td></tr>`).join('') : '<tr><td colspan="4">Tidak ada buku sedang dipinjam.</td></tr>');
}

// ================== LOGIN GURU/PIKET ==================
document.getElementById('btnLoginGuruPiket').addEventListener('click', ()=> document.getElementById('modalGuruPiket').classList.remove('hidden'));
document.getElementById('btnBatalLoginGuru').addEventListener('click', ()=> document.getElementById('modalGuruPiket').classList.add('hidden'));
document.getElementById('btnBatalLoginGuruBarcode').addEventListener('click', ()=> document.getElementById('modalGuruPiket').classList.add('hidden'));
document.getElementById('tabLoginManual').addEventListener('click', ()=>{
  document.getElementById('tabLoginManual').classList.add('active');
  document.getElementById('tabLoginBarcode').classList.remove('active');
  document.getElementById('loginManualBox').classList.remove('hidden');
  document.getElementById('loginBarcodeBox').classList.add('hidden');
});
document.getElementById('tabLoginBarcode').addEventListener('click', ()=>{
  document.getElementById('tabLoginBarcode').classList.add('active');
  document.getElementById('tabLoginManual').classList.remove('active');
  document.getElementById('loginBarcodeBox').classList.remove('hidden');
  document.getElementById('loginManualBox').classList.add('hidden');
  focusInput('gpBarcodeInput');
});

async function prosesLoginGuru(guru){
  const today = todayStr();
  let sudahAbsen = absensiGuruList.find(g=>g.username===guru.username && g.tanggal===today);
  if(!sudahAbsen){
    const rec = { username:guru.username, nama:guru.nama, tanggal:today, jamLogin:nowTime(), gid:guru.gid, jabatan:guru.jabatan };
    absensiGuruList.push(rec);
    localStorage.setItem('absensiGuruList', JSON.stringify(absensiGuruList));
    await kirimKeServer('saveAbsensiGuru', rec);
  }
  localStorage.setItem('guruPiketAktif', JSON.stringify({gid:guru.gid, username:guru.username, nama:guru.nama, jabatan:guru.jabatan}));
  if(guru.jabatan === 'Administrator'){
    isAdminUnlocked = true; localStorage.setItem('adminAktif','1'); renderAdminUI();
  }
  tampilkanStatusGuruPiket(guru.nama);
  document.getElementById('modalGuruPiket').classList.add('hidden');
  renderDashboard();
}
document.getElementById('btnSubmitLoginGuru').addEventListener('click', async ()=>{
  const u = document.getElementById('gpUsername').value.trim();
  const p = document.getElementById('gpPassword').value.trim();
  const guru = guruList.find(g=>g.username===u && g.password===p);
  if(!guru){ alert('Username/password salah!'); return; }
  document.getElementById('gpUsername').value=''; document.getElementById('gpPassword').value='';
  await prosesLoginGuru(guru);
});
document.getElementById('gpBarcodeInput').addEventListener('keypress', async e=>{
  if(e.key==='Enter'){
    const gid = e.target.value.trim(); e.target.value='';
    const guru = getGuruByGID(gid);
    const fb = document.getElementById('feedbackLoginGuru');
    if(!guru){ fb.className='scan-feedback error'; fb.innerText='❌ Kode tidak ditemukan.'; beep(false); return; }
    fb.className='scan-feedback success'; fb.innerText=`✅ Login sebagai ${guru.nama}`;
    beep(true); await prosesLoginGuru(guru);
  }
});
document.getElementById('btnKameraLoginGuru').addEventListener('click', ()=> bukaKamera('gpBarcodeInput', false));
document.getElementById('btnLogoutGuruPiket').addEventListener('click', ()=>{
  localStorage.removeItem('guruPiketAktif');
  document.getElementById('guruPiketBelumLogin').classList.remove('hidden');
  document.getElementById('guruPiketSudahLogin').classList.add('hidden');
  cekAksesPetugas();
});
function tampilkanStatusGuruPiket(nama){
  document.getElementById('namaGuruPiketAktif').innerText = nama;
  document.getElementById('guruPiketBelumLogin').classList.add('hidden');
  document.getElementById('guruPiketSudahLogin').classList.remove('hidden');
  cekAksesPetugas();
}
function cekSesiGuruPiket(){
  const data = JSON.parse(localStorage.getItem('guruPiketAktif'));
  if(data) tampilkanStatusGuruPiket(data.nama);
  cekAksesPetugas();
}

// ================== DATA SISWA/GURU/BUKU (ADMIN) ==================
function renderFilterKelasOptions(){
  const kelasUnik = [...new Set(siswaList.map(s=>s.kelas))];
  const opt = '<option value="">Semua Kelas</option>' + kelasUnik.map(k=>`<option value="${k}">${k}</option>`).join('');
  document.getElementById('filterKelasSiswa').innerHTML = opt;
  document.getElementById('rekapFilterKelas').innerHTML = opt;
  document.getElementById('laporanFilterKelas').innerHTML = '<option value="">-- Pilih Kelas --</option>' + kelasUnik.map(k=>`<option value="${k}">${k}</option>`).join('');
}
function renderLaporanOptions(){
  document.getElementById('laporanPilihSiswa').innerHTML = '<option value="">-- Pilih Siswa --</option>' + siswaList.map(s=>`<option value="${s.nis}">${s.nama} - ${s.kelas}</option>`).join('');
  document.getElementById('laporanPilihGuru').innerHTML = '<option value="">-- Pilih Guru --</option>' + guruList.map(g=>`<option value="${g.gid}">${g.nama} - ${g.jabatan}</option>`).join('');
}

function renderTabelSiswa(){
  const keyword = (document.getElementById('searchSiswa').value||'').toLowerCase();
  const kelas = document.getElementById('filterKelasSiswa').value;
  const data = siswaList.filter(s=> (s.nama.toLowerCase().includes(keyword)||s.nis.includes(keyword)) && (!kelas||s.kelas===kelas));
  document.getElementById('tabelSiswa').innerHTML = `<tr><th><input type="checkbox" id="checkAllSiswa"></th><th>NIS</th><th>Nama</th><th>Kelas</th><th>JK</th><th>Aksi</th></tr>` +
    data.map(s=>`<tr><td><input type="checkbox" class="chk-siswa" value="${s.nis}"></td><td>${s.nis}</td><td>${s.nama}</td><td>${s.kelas}</td><td>${s.jk}</td><td><button class="btn-secondary" onclick="bukaEditSiswa('${s.nis}')">✏️</button> <button class="btn-secondary" onclick="hapusSiswa('${s.nis}')">🗑️</button> <button class="btn-secondary" onclick="tampilkanKartuMultiple([getSiswaByNIS('${s.nis}')])">🪪</button></td></tr>`).join('');
  const chkAll = document.getElementById('checkAllSiswa');
  if(chkAll) chkAll.addEventListener('change', ()=> document.querySelectorAll('.chk-siswa').forEach(c=>c.checked=chkAll.checked));
}
document.getElementById('searchSiswa').addEventListener('input', renderTabelSiswa);
document.getElementById('filterKelasSiswa').addEventListener('change', renderTabelSiswa);
document.getElementById('btnTambahSiswa').addEventListener('click', ()=>{
  editingNis=null;
  document.getElementById('judulModalSiswa').innerText='Tambah Siswa';
  ['formNis','formNama','formKelas'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('formJk').value='L';
  document.getElementById('formNis').disabled=false;
  document.getElementById('modalSiswaForm').classList.remove('hidden');
});
function bukaEditSiswa(nis){
  const s = getSiswaByNIS(nis); editingNis=nis;
  document.getElementById('judulModalSiswa').innerText='Edit Siswa';
  document.getElementById('formNis').value=s.nis; document.getElementById('formNis').disabled=true;
  document.getElementById('formNama').value=s.nama;
  document.getElementById('formKelas').value=s.kelas;
  document.getElementById('formJk').value=s.jk;
  document.getElementById('modalSiswaForm').classList.remove('hidden');
}
document.getElementById('btnBatalSiswa').addEventListener('click', ()=> document.getElementById('modalSiswaForm').classList.add('hidden'));
document.getElementById('btnSimpanSiswa').addEventListener('click', async ()=>{
  const nis=document.getElementById('formNis').value.trim();
  const nama=document.getElementById('formNama').value.trim();
  const kelas=document.getElementById('formKelas').value.trim();
  const jk=document.getElementById('formJk').value;
  if(!nis||!nama||!kelas){alert('Lengkapi!');return;}
  if(editingNis){ const s=getSiswaByNIS(editingNis); s.nama=nama; s.kelas=kelas; s.jk=jk; }
  else { if(getSiswaByNIS(nis)){alert('NIS sudah ada!');return;} siswaList.push({nis,nama,kelas,jk}); }
  localStorage.setItem('siswaList', JSON.stringify(siswaList));
  document.getElementById('modalSiswaForm').classList.add('hidden');
  renderTabelSiswa(); renderFilterKelasOptions(); renderLaporanOptions(); renderDashboard();
  await kirimKeServer('saveSiswa', {nis,nama,kelas,jk});
});
async function hapusSiswa(nis){
  if(!confirm('Yakin hapus?')) return;
  siswaList = siswaList.filter(s=>s.nis!==nis);
  localStorage.setItem('siswaList', JSON.stringify(siswaList));
  renderTabelSiswa(); renderFilterKelasOptions(); renderLaporanOptions(); renderDashboard();
  await kirimKeServer('deleteSiswa', {nis});
}

function renderTabelGuru(){
  const kw = (document.getElementById('searchGuru').value||'').toLowerCase();
  const data = guruList.filter(g=> g.nama.toLowerCase().includes(kw)||g.username.toLowerCase().includes(kw)||g.gid.toLowerCase().includes(kw));
  document.getElementById('tabelGuru').innerHTML = `<tr><th><input type="checkbox" id="checkAllGuru"></th><th>GID</th><th>Username</th><th>Nama</th><th>Jabatan</th><th>Aksi</th></tr>` +
    data.map(g=>`<tr><td><input type="checkbox" class="chk-guru" value="${g.gid}"></td><td>${g.gid}</td><td>${g.username}</td><td>${g.nama}</td><td>${g.jabatan}</td><td><button class="btn-secondary" onclick="bukaEditGuru('${g.gid}')">✏️</button> <button class="btn-secondary" onclick="hapusGuru('${g.gid}')">🗑️</button> <button class="btn-secondary" onclick="tampilkanKartuGuruMultiple([getGuruByGID('${g.gid}')])">🪪</button></td></tr>`).join('');
  const chkAll = document.getElementById('checkAllGuru');
  if(chkAll) chkAll.addEventListener('change', ()=> document.querySelectorAll('.chk-guru').forEach(c=>c.checked=chkAll.checked));
}
document.getElementById('searchGuru').addEventListener('input', renderTabelGuru);
document.getElementById('btnTambahGuru').addEventListener('click', ()=>{
  editingGid=null;
  document.getElementById('judulModalGuru').innerText='Tambah Guru';
  ['formGid','formGuruUsername','formGuruPassword','formGuruNama','formGuruJabatan'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('formGid').disabled=false;
  document.getElementById('modalGuruForm').classList.remove('hidden');
});
function bukaEditGuru(gid){
  const g=getGuruByGID(gid); editingGid=gid;
  document.getElementById('judulModalGuru').innerText='Edit Guru';
  document.getElementById('formGid').value=g.gid; document.getElementById('formGid').disabled=true;
  document.getElementById('formGuruUsername').value=g.username;
  document.getElementById('formGuruPassword').value=g.password;
  document.getElementById('formGuruNama').value=g.nama;
  document.getElementById('formGuruJabatan').value=g.jabatan;
  document.getElementById('modalGuruForm').classList.remove('hidden');
}
document.getElementById('btnBatalGuru').addEventListener('click', ()=> document.getElementById('modalGuruForm').classList.add('hidden'));
document.getElementById('btnSimpanGuru').addEventListener('click', async ()=>{
  const gid=document.getElementById('formGid').value.trim();
  const username=document.getElementById('formGuruUsername').value.trim();
  const password=document.getElementById('formGuruPassword').value.trim();
  const nama=document.getElementById('formGuruNama').value.trim();
  const jabatan=document.getElementById('formGuruJabatan').value.trim();
  if(!gid||!username||!password||!nama||!jabatan){alert('Lengkapi!');return;}
  if(editingGid){ const g=getGuruByGID(editingGid); g.username=username; g.password=password; g.nama=nama; g.jabatan=jabatan; }
  else { if(getGuruByGID(gid)){alert('GID sudah ada!');return;} guruList.push({gid,username,password,nama,jabatan}); }
  localStorage.setItem('guruList', JSON.stringify(guruList));
  document.getElementById('modalGuruForm').classList.add('hidden');
  renderTabelGuru(); renderLaporanOptions();
  await kirimKeServer('saveGuru', {gid,username,password,nama,jabatan});
});
async function hapusGuru(gid){
  if(!confirm('Yakin hapus?')) return;
  guruList = guruList.filter(g=>g.gid!==gid);
  localStorage.setItem('guruList', JSON.stringify(guruList));
  renderTabelGuru(); renderLaporanOptions();
  await kirimKeServer('deleteGuru', {gid});
}

// --- DATA BUKU ---
function renderTabelBuku(){
  const kw = (document.getElementById('searchBuku').value||'').toLowerCase();
  const data = bukuList.filter(b=> b.judul.toLowerCase().includes(kw)||b.kode.toLowerCase().includes(kw)||b.penulis.toLowerCase().includes(kw));
  document.getElementById('tabelBuku').innerHTML = `<tr><th>Kode</th><th>Judul</th><th>Penulis</th><th>Kategori</th><th>Stok</th><th>Aksi</th></tr>` +
    data.map(b=>`<tr><td>${b.kode}</td><td>${b.judul}</td><td>${b.penulis}</td><td>${b.kategori}</td><td>${b.stok}</td><td><button class="btn-secondary" onclick="bukaEditBuku('${b.kode}')">✏️</button> <button class="btn-secondary" onclick="hapusBuku('${b.kode}')">🗑️</button></td></tr>`).join('');
}
document.getElementById('searchBuku').addEventListener('input', renderTabelBuku);
document.getElementById('btnTambahBuku').addEventListener('click', ()=>{
  editingKodeBuku=null;
  document.getElementById('judulModalBuku').innerText='Tambah Buku';
  ['formKodeBuku','formJudulBuku','formPenulisBuku','formKategoriBuku'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('formStokBuku').value=1;
  document.getElementById('formKodeBuku').disabled=false;
  document.getElementById('modalBukuForm').classList.remove('hidden');
});
function bukaEditBuku(kode){
  const b=getBukuByKode(kode); editingKodeBuku=kode;
  document.getElementById('judulModalBuku').innerText='Edit Buku';
  document.getElementById('formKodeBuku').value=b.kode; document.getElementById('formKodeBuku').disabled=true;
  document.getElementById('formJudulBuku').value=b.judul;
  document.getElementById('formPenulisBuku').value=b.penulis;
  document.getElementById('formKategoriBuku').value=b.kategori;
  document.getElementById('formStokBuku').value=b.stok;
  document.getElementById('modalBukuForm').classList.remove('hidden');
}
document.getElementById('btnBatalBuku').addEventListener('click', ()=> document.getElementById('modalBukuForm').classList.add('hidden'));
document.getElementById('btnSimpanBuku').addEventListener('click', async ()=>{
  const kode=document.getElementById('formKodeBuku').value.trim();
  const judul=document.getElementById('formJudulBuku').value.trim();
  const penulis=document.getElementById('formPenulisBuku').value.trim();
  const kategori=document.getElementById('formKategoriBuku').value.trim();
  const stok=parseInt(document.getElementById('formStokBuku').value)||1;
  if(!kode||!judul){alert('Kode dan judul wajib!');return;}
  if(editingKodeBuku){ const b=getBukuByKode(editingKodeBuku); b.judul=judul; b.penulis=penulis; b.kategori=kategori; b.stok=stok; }
  else { if(getBukuByKode(kode)){alert('Kode buku sudah ada!');return;} bukuList.push({kode,judul,penulis,kategori,stok}); }
  localStorage.setItem('bukuList', JSON.stringify(bukuList));
  document.getElementById('modalBukuForm').classList.add('hidden');
  renderTabelBuku();
  await kirimKeServer('saveBuku', {kode,judul,penulis,kategori,stok});
});
async function hapusBuku(kode){
  if(!confirm('Yakin hapus buku ini?')) return;
  bukuList = bukuList.filter(b=>b.kode!==kode);
  localStorage.setItem('bukuList', JSON.stringify(bukuList));
  renderTabelBuku();
  await kirimKeServer('deleteBuku', {kode});
}

// ================== KARTU BARCODE ==================
function buatHtmlKartu(s){
  return `<div class="kartu-siswa" data-nis="${s.nis}"><h4>${APP_CONFIG.namaSekolah}</h4><p>Kartu Monitoring Siswa ${APP_CONFIG.tahunAjaran}</p><h3>${s.nama}</h3><p>NIS: ${s.nis} | Kelas: ${s.kelas}</p><canvas id="barcode-${s.nis}" class="barcode-canvas"></canvas><div id="qr-${s.nis}" class="qr-wrap"></div></div>`;
}
function tampilkanKartuMultiple(data){
  if(!data||!data.length){alert('Tidak ada data.');return;}
  document.getElementById('areaKartu').innerHTML = data.map(buatHtmlKartu).join('');
  document.getElementById('modalKartu').classList.remove('hidden');
  setTimeout(()=>{
    data.forEach(s=>{
      JsBarcode(`#barcode-${s.nis}`, s.nis, { format:"CODE128", width:2, height:50, displayValue:true });
      document.getElementById(`qr-${s.nis}`).innerHTML='';
      new QRCode(document.getElementById(`qr-${s.nis}`), { text:s.nis, width:80, height:80 });
    });
  }, 100);
}
document.getElementById('btnCetakDipilih').addEventListener('click', ()=>{
  const chk = [...document.querySelectorAll('.chk-siswa:checked')].map(c=>c.value);
  if(!chk.length){alert('Pilih minimal 1 siswa.');return;}
  tampilkanKartuMultiple(siswaList.filter(s=>chk.includes(s.nis)));
});
document.getElementById('btnCetakPerKelas').addEventListener('click', ()=>{
  const kelas = document.getElementById('filterKelasSiswa').value;
  if(!kelas){alert('Pilih kelas dulu.');return;}
  tampilkanKartuMultiple(siswaList.filter(s=>s.kelas===kelas));
});
document.getElementById('btnCetakSemua').addEventListener('click', ()=> tampilkanKartuMultiple(siswaList));

function buatHtmlKartuGuru(g){
  return `<div class="kartu-siswa" data-gid="${g.gid}"><h4>${APP_CONFIG.namaSekolah}</h4><p>Kartu Identitas Guru</p><h3>${g.nama}</h3><p>Kode: ${g.gid} | ${g.jabatan}</p><canvas id="barcode-g-${g.gid}" class="barcode-canvas"></canvas><div id="qr-g-${g.gid}" class="qr-wrap"></div></div>`;
}
function tampilkanKartuGuruMultiple(data){
  if(!data||!data.length){alert('Tidak ada data.');return;}
  document.getElementById('areaKartu').innerHTML = data.map(buatHtmlKartuGuru).join('');
  document.getElementById('modalKartu').classList.remove('hidden');
  setTimeout(()=>{
    data.forEach(g=>{
      JsBarcode(`#barcode-g-${g.gid}`, g.gid, { format:"CODE128", width:2, height:50, displayValue:true });
      document.getElementById(`qr-g-${g.gid}`).innerHTML='';
      new QRCode(document.getElementById(`qr-g-${g.gid}`), { text:g.gid, width:80, height:80 });
    });
  }, 100);
}
document.getElementById('btnCetakGuruDipilih').addEventListener('click', ()=>{
  const chk = [...document.querySelectorAll('.chk-guru:checked')].map(c=>c.value);
  if(!chk.length){alert('Pilih minimal 1 guru.');return;}
  tampilkanKartuGuruMultiple(guruList.filter(g=>chk.includes(g.gid)));
});
document.getElementById('btnCetakGuruSemua').addEventListener('click', ()=> tampilkanKartuGuruMultiple(guruList));

document.getElementById('btnTutupKartu').addEventListener('click', ()=> document.getElementById('modalKartu').classList.add('hidden'));
document.getElementById('btnPrintKartu').addEventListener('click', ()=> window.print());
document.getElementById('btnUnduhKartu').addEventListener('click', async ()=>{
  const els = document.querySelectorAll('#areaKartu .kartu-siswa');
  if(!els.length) return;
  if(els.length>1) alert(`Akan mengunduh ${els.length} kartu. Izinkan "Allow multiple downloads".`);
  for(let i=0;i<els.length;i++){
    const canvas = await html2canvas(els[i], {scale:2, backgroundColor:'#fff'});
    const id = els[i].dataset.nis || els[i].dataset.gid || i;
    const a = document.createElement('a');
    a.download = `kartu_${id}.jpg`;
    a.href = canvas.toDataURL('image/jpeg', 0.95);
    a.click();
    await new Promise(r=>setTimeout(r,400));
  }
});

// ================== REKAP ==================
document.querySelectorAll('#page-rekap .mode-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('#page-rekap .mode-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    rekapTab = btn.dataset.tab; renderRekap();
  });
});
document.getElementById('btnFilterRekap').addEventListener('click', renderRekap);

function renderRekap(){
  const dari = document.getElementById('rekapDariTgl').value;
  const sampai = document.getElementById('rekapSampaiTgl').value;
  const kelas = document.getElementById('rekapFilterKelas').value;
  const tbl = document.getElementById('tabelRekap');
  function cocok(tgl){ if(dari&&tgl<dari)return false; if(sampai&&tgl>sampai)return false; return true; }

  if(rekapTab==='absen'){
    const data = absensiHarian.filter(a=> cocok(a.tanggal)&&(!kelas||a.kelas===kelas));
    tbl.innerHTML = `<tr><th>Tanggal</th><th>Nama</th><th>Kelas</th><th>Masuk</th><th>Status</th><th>Pulang</th><th>Pulang Awal</th><th>Ket</th></tr>` +
      data.map(a=>`<tr><td>${a.tanggal}</td><td>${a.nama}</td><td>${a.kelas}</td><td>${a.jamMasuk||'-'}</td><td>${a.statusMasuk||'-'}</td><td>${a.jamPulang||'-'}</td><td>${a.jenisPulangAwal?a.jenisPulangAwal+' ('+(a.jamPulangAwal||'')+')':'-'}</td><td>${a.ketPulangAwal||'-'}</td></tr>`).join('');
  } else if(rekapTab==='hafalan'){
    const data = hafalanList.filter(h=> cocok(h.tanggal)&&(!kelas||h.kelas===kelas));
    tbl.innerHTML = `<tr><th>Tanggal</th><th>Nama</th><th>Kelas</th><th>Jenis</th><th>Surat</th><th>Predikat</th><th>Dicatat</th></tr>` +
      data.map(h=>`<tr><td>${h.tanggal}</td><td>${h.nama}</td><td>${h.kelas}</td><td>${h.jenis}</td><td>${h.surat}</td><td>${h.predikat}</td><td>${h.dicatatOleh||'-'}</td></tr>`).join('');
  } else if(rekapTab==='sholat'){
    const data = sholatList.filter(s=> cocok(s.tanggal)&&(!kelas||s.kelas===kelas));
    tbl.innerHTML = `<tr><th>Tanggal</th><th>Nama</th><th>Kelas</th><th>Jenis</th><th>Waktu</th><th>Dicatat</th></tr>` +
      data.map(s=>`<tr><td>${s.tanggal}</td><td>${s.nama}</td><td>${s.kelas}</td><td>${s.jenis}</td><td>${s.waktu}</td><td>${s.dicatatOleh||'-'}</td></tr>`).join('');
  } else if(rekapTab==='hp'){
    const data = hpList.filter(h=> cocok(h.tanggal)&&(!kelas||h.kelas===kelas));
    tbl.innerHTML = `<tr><th>Tanggal</th><th>Nama</th><th>Kelas</th><th>Titip</th><th>Ambil</th><th>Petugas Titip</th><th>Petugas Ambil</th></tr>` +
      data.map(h=>`<tr><td>${h.tanggal}</td><td>${h.nama}</td><td>${h.kelas}</td><td>${h.jamTitip||'-'}</td><td>${h.jamAmbil||'-'}</td><td>${h.petugasTitip||'-'}</td><td>${h.petugasAmbil||'-'}</td></tr>`).join('');
  } else if(rekapTab==='kunjungan'){
    const data = kunjunganList.filter(k=> cocok(k.tanggal)&&(!kelas||k.kelas===kelas));
    tbl.innerHTML = `<tr><th>Tanggal</th><th>Nama</th><th>Kelas</th><th>Waktu</th></tr>` +
      data.map(k=>`<tr><td>${k.tanggal}</td><td>${k.nama}</td><td>${k.kelas}</td><td>${k.waktu}</td></tr>`).join('');
  } else if(rekapTab==='pinjam'){
    const data = pinjamList.filter(p=> cocok(p.tglPinjam)&&(!kelas||p.kelas===kelas));
    tbl.innerHTML = `<tr><th>Tgl Pinjam</th><th>Nama</th><th>Kelas</th><th>Buku</th><th>Tgl Kembali</th><th>Status</th></tr>` +
      data.map(p=>`<tr><td>${p.tglPinjam}</td><td>${p.nama}</td><td>${p.kelas}</td><td>${p.judul}</td><td>${p.tglKembali||'-'}</td><td>${p.status}</td></tr>`).join('');
  } else {
    const data = absensiGuruList.filter(g=> cocok(g.tanggal));
    tbl.innerHTML = `<tr><th>Tanggal</th><th>Nama Guru</th><th>Jabatan</th><th>Jam Login</th></tr>` +
      data.map(g=>`<tr><td>${g.tanggal}</td><td>${g.nama}</td><td>${g.jabatan||'-'}</td><td>${g.jamLogin}</td></tr>`).join('');
  }
}
document.getElementById('btnExportCSV').addEventListener('click', ()=> exportRekap('csv'));
document.getElementById('btnExportExcel').addEventListener('click', ()=> exportRekap('xls'));
function exportRekap(type){
  const tbl = document.getElementById('tabelRekap');
  let csv = [];
  tbl.querySelectorAll('tr').forEach(tr=>{
    let row = []; tr.querySelectorAll('th,td').forEach(c=>row.push('"'+c.innerText+'"')); csv.push(row.join(','));
  });
  const blob = new Blob([csv.join('\n')], {type: type==='csv'?'text/csv':'application/vnd.ms-excel'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rekap_${rekapTab}_${todayStr()}.${type==='csv'?'csv':'xls'}`;
  a.click();
}

// ================== LAPORAN BULANAN ==================
document.getElementById('btnTabLaporanSiswa').addEventListener('click', ()=>{
  document.getElementById('btnTabLaporanSiswa').classList.add('active');
  document.getElementById('btnTabLaporanGuru').classList.remove('active');
  document.getElementById('laporanSiswaBox').classList.remove('hidden');
  document.getElementById('laporanGuruBox').classList.add('hidden');
});
document.getElementById('btnTabLaporanGuru').addEventListener('click', ()=>{
  document.getElementById('btnTabLaporanGuru').classList.add('active');
  document.getElementById('btnTabLaporanSiswa').classList.remove('active');
  document.getElementById('laporanGuruBox').classList.remove('hidden');
  document.getElementById('laporanSiswaBox').classList.add('hidden');
});

function buatHtmlLaporan(siswa, bulan){
  const absenBulan = absensiHarian.filter(a=> a.nis===siswa.nis && a.tanggal.startsWith(bulan));
  const hafalanBulan = hafalanList.filter(h=> h.nis===siswa.nis && h.tanggal.startsWith(bulan));
  const sholatBulan = sholatList.filter(s=> s.nis===siswa.nis && s.tanggal.startsWith(bulan));
  const hpBulan = hpList.filter(h=> h.nis===siswa.nis && h.tanggal.startsWith(bulan));
  const kunjunganBulan = kunjunganList.filter(k=> k.nis===siswa.nis && k.tanggal.startsWith(bulan));
  const pinjamBulan = pinjamList.filter(p=> p.nis===siswa.nis && p.tglPinjam.startsWith(bulan));
  const pulangAwalBulan = absenBulan.filter(a=>a.jenisPulangAwal);

  let namaBulan=bulan;
  try{ namaBulan = new Date(bulan+'-01').toLocaleDateString('id-ID',{month:'long',year:'numeric'}); }catch(e){}

  return `<div class="laporan-card" data-nis="${siswa.nis}">
    <div class="laporan-header"><h2>${APP_CONFIG.namaSekolah}</h2><p>Laporan Bulanan Kegiatan Siswa - ${namaBulan}</p></div>
    <table class="laporan-info"><tr><td><strong>Nama</strong></td><td>: ${siswa.nama}</td></tr><tr><td><strong>NIS</strong></td><td>: ${siswa.nis}</td></tr><tr><td><strong>Kelas</strong></td><td>: ${siswa.kelas}</td></tr></table>

    <h4>📋 Rekap Kehadiran</h4>
    <table class="laporan-table">
      <tr><th>Total Hadir</th><td>${absenBulan.filter(a=>a.jamMasuk).length} hari</td></tr>
      <tr><th>Tepat Waktu</th><td>${absenBulan.filter(a=>a.statusMasuk==='Tepat Waktu').length} hari</td></tr>
      <tr><th>Terlambat</th><td>${absenBulan.filter(a=>a.statusMasuk==='Terlambat').length} hari</td></tr>
      <tr><th>Pulang Awal (Izin/Sakit)</th><td>${pulangAwalBulan.length} kali</td></tr>
    </table>

    ${pulangAwalBulan.length ? `<h4>⚠️ Rincian Pulang Awal</h4>
    <table class="laporan-table"><tr><th>Tanggal</th><th>Jenis</th><th>Keterangan</th></tr>
      ${pulangAwalBulan.map(a=>`<tr><td>${a.tanggal}</td><td>${a.jenisPulangAwal}</td><td>${a.ketPulangAwal||'-'}</td></tr>`).join('')}
    </table>` : ''}

    <h4>📖 Setoran Hafalan (${hafalanBulan.length}x)</h4>
    <table class="laporan-table">
      <tr><th>Tanggal</th><th>Jenis</th><th>Surat</th><th>Predikat</th><th>Dicatat</th></tr>
      ${hafalanBulan.map(h=>`<tr><td>${h.tanggal}</td><td>${h.jenis}</td><td>${h.surat}</td><td>${h.predikat}</td><td>${h.dicatatOleh||'-'}</td></tr>`).join('') || '<tr><td colspan="5">Belum ada</td></tr>'}
    </table>

    <h4>🕌 Sholat Berjamaah</h4>
    <table class="laporan-table"><tr><th>Dhuha</th><td>${sholatBulan.filter(s=>s.jenis==='Dhuha').length}x</td></tr><tr><th>Dzuhur</th><td>${sholatBulan.filter(s=>s.jenis==='Dzuhur').length}x</td></tr></table>

    <h4>📱 Penitipan HP (${hpBulan.length}x)</h4>
    <h4>📚 Kunjungan Perpustakaan: ${kunjunganBulan.length}x</h4>
    <h4>📥 Peminjaman Buku (${pinjamBulan.length}x)</h4>
    <table class="laporan-table">
      <tr><th>Tgl Pinjam</th><th>Buku</th><th>Tgl Kembali</th><th>Status</th></tr>
      ${pinjamBulan.map(p=>`<tr><td>${p.tglPinjam}</td><td>${p.judul}</td><td>${p.tglKembali||'-'}</td><td>${p.status}</td></tr>`).join('') || '<tr><td colspan="4">Belum ada</td></tr>'}
    </table>

    <p class="laporan-footer">Dicetak otomatis pada ${new Date().toLocaleString('id-ID')}</p>
  </div>`;
}

document.getElementById('btnTampilkanLaporan').addEventListener('click', ()=>{
  const nis = document.getElementById('laporanPilihSiswa').value;
  const bulan = document.getElementById('laporanBulan').value;
  if(!nis||!bulan){alert('Pilih siswa dan bulan.');return;}
  document.getElementById('areaLaporan').innerHTML = buatHtmlLaporan(getSiswaByNIS(nis), bulan);
});
document.getElementById('btnGenerateLaporanSemua').addEventListener('click', ()=>{
  const bulan = document.getElementById('laporanBulan').value;
  const kelas = document.getElementById('laporanFilterKelas').value;
  if(!bulan||!kelas){alert('Pilih bulan dan kelas.');return;}
  document.getElementById('areaLaporan').innerHTML = siswaList.filter(s=>s.kelas===kelas).map(s=>buatHtmlLaporan(s,bulan)).join('<div class="page-break"></div>');
});
document.getElementById('btnGenerateLaporanSemuaSiswa').addEventListener('click', ()=>{
  const bulan = document.getElementById('laporanBulan').value;
  if(!bulan){alert('Pilih bulan.');return;}
  document.getElementById('areaLaporan').innerHTML = siswaList.map(s=>buatHtmlLaporan(s,bulan)).join('<div class="page-break"></div>');
});

function buatHtmlLaporanGuru(guru, bulan){
  const hafGuru = hafalanList.filter(h=> h.dicatatOleh===guru.nama && h.tanggal.startsWith(bulan));
  const sholGuru = sholatList.filter(s=> s.dicatatOleh===guru.nama && s.tanggal.startsWith(bulan));
  let namaBulan=bulan;
  try{ namaBulan = new Date(bulan+'-01').toLocaleDateString('id-ID',{month:'long',year:'numeric'}); }catch(e){}
  return `<div class="laporan-card" data-gid="${guru.gid}">
    <div class="laporan-header"><h2>${APP_CONFIG.namaSekolah}</h2><p>Laporan Bulanan Guru - ${namaBulan}</p></div>
    <table class="laporan-info"><tr><td><strong>Nama</strong></td><td>: ${guru.nama}</td></tr><tr><td><strong>Jabatan</strong></td><td>: ${guru.jabatan}</td></tr></table>
    <h4>📖 Setoran Hafalan Dicatat (${hafGuru.length}x)</h4>
    <table class="laporan-table"><tr><th>Tanggal</th><th>Siswa</th><th>Surat</th><th>Predikat</th></tr>
      ${hafGuru.map(h=>`<tr><td>${h.tanggal}</td><td>${h.nama}</td><td>${h.surat}</td><td>${h.predikat}</td></tr>`).join('') || '<tr><td colspan="4">Tidak ada</td></tr>'}
    </table>
    <h4>🕌 Sholat Dicatat</h4>
    <table class="laporan-table"><tr><th>Dhuha</th><td>${sholGuru.filter(s=>s.jenis==='Dhuha').length}x</td></tr><tr><th>Dzuhur</th><td>${sholGuru.filter(s=>s.jenis==='Dzuhur').length}x</td></tr></table>
    <p class="laporan-footer">Dicetak otomatis pada ${new Date().toLocaleString('id-ID')}</p>
  </div>`;
}
document.getElementById('btnTampilkanLaporanGuru').addEventListener('click', ()=>{
  const gid = document.getElementById('laporanPilihGuru').value;
  const bulan = document.getElementById('laporanBulanGuru').value;
  if(!gid||!bulan){alert('Pilih guru dan bulan.');return;}
  document.getElementById('areaLaporan').innerHTML = buatHtmlLaporanGuru(getGuruByGID(gid), bulan);
});
document.getElementById('btnGenerateLaporanSemuaGuru').addEventListener('click', ()=>{
  const bulan = document.getElementById('laporanBulanGuru').value;
  if(!bulan){alert('Pilih bulan.');return;}
  document.getElementById('areaLaporan').innerHTML = guruList.map(g=>buatHtmlLaporanGuru(g,bulan)).join('<div class="page-break"></div>');
});
document.getElementById('btnPrintLaporan').addEventListener('click', ()=>{
  if(!document.getElementById('areaLaporan').innerHTML.trim()){alert('Tampilkan laporan dulu.');return;}
  window.print();
});
document.getElementById('btnUnduhLaporan').addEventListener('click', async ()=>{
  const cards = document.querySelectorAll('#areaLaporan .laporan-card');
  if(!cards.length){alert('Tampilkan laporan dulu.');return;}
  if(cards.length>1) alert(`Akan mengunduh ${cards.length} laporan. Izinkan "Allow multiple downloads".`);
  for(let i=0;i<cards.length;i++){
    const canvas = await html2canvas(cards[i], {scale:2, backgroundColor:'#fff'});
    const id = cards[i].dataset.nis || cards[i].dataset.gid || i;
    const a = document.createElement('a');
    a.download = `laporan_${id}.jpg`;
    a.href = canvas.toDataURL('image/jpeg', 0.95);
    a.click();
    await new Promise(r=>setTimeout(r,400));
  }
});

// ================== INIT ==================
async function init(){
  document.getElementById('namaSekolahLabel').innerText = APP_CONFIG.namaSekolah;
  applyTheme(localStorage.getItem('theme') || 'light');
  cekSesiAdmin(); cekSesiGuruPiket();
  await loadAllDataFromServer();
  tickJam();
  setInterval(loadAllDataFromServer, 20000);
}
window.addEventListener('DOMContentLoaded', init);