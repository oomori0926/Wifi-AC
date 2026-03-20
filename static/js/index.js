
let currentQRCode = null;
let currentWiFiData = null;


// レスポンシブ時の表示処理
function updateFormToggleLabel(isExpanded) {
    const formToggle = document.getElementById('form-toggle');
    if (!formToggle) return;
    formToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    const label = isExpanded ? 'Wi-Fi情報を隠す' : 'Wi-Fi情報を表示';
    formToggle.setAttribute('aria-label', label);
    formToggle.setAttribute('title', label);
}


// レスポンシブ時の開閉処理
function setupMobileFormToggle() {
    const formSection = document.querySelector('.form-section');
    const formToggle = document.getElementById('form-toggle');
    if (!formSection || !formToggle) return;

    const mobileMedia = window.matchMedia('(max-width: 960px)');
    const syncFormState = () => {
        if (mobileMedia.matches) {
            if (!formSection.classList.contains('is-collapsed')) {
                formSection.classList.add('is-collapsed');
            }
            updateFormToggleLabel(false);
            return;
        }
        formSection.classList.remove('is-collapsed');
        updateFormToggleLabel(true);
    };
    formToggle.addEventListener('click', () => {
        if (!mobileMedia.matches) return;
        const isCollapsed = formSection.classList.toggle('is-collapsed');
        updateFormToggleLabel(!isCollapsed);
    });
    mobileMedia.addEventListener('change', syncFormState);
    syncFormState();
}


// フォーム送信時の処理
document.getElementById('wifi-form').addEventListener('submit', function(e) {
    e.preventDefault();
    generateQRCode();
});


// QRコード生成関数
function generateQRCode() {
    const ssid = document.getElementById('ssid').value;
    const password = document.getElementById('password').value;
    const security = document.getElementById('security').value;

    if (!ssid) {
        showNotification('ネットワーク名を入力してください', 'error');
        return;
    }
    // Wi-Fi QRコードのフォーマット
    let wifiString;
    if (security === 'nopass') {
        wifiString = `WIFI:T:nopass;S:${ssid};;`;
    } else {
        wifiString = `WIFI:T:${security};S:${ssid};P:${password};;`;
    }
    // 現在のWi-Fiデータを保存
    currentWiFiData = { ssid, password, security };

    // 空の状態を非表示、QR表示エリアを表示
    document.querySelector('.empty-state').style.display = 'none';
    document.getElementById('qr-display').style.display = 'flex';
    document.getElementById('display-ssid').textContent = ssid;
    document.getElementById('print-ssid').textContent = ssid;

    // 既存のQRコードをクリア
    const qrcodeElement = document.getElementById('qrcode');
    qrcodeElement.innerHTML = '';

    // QRコード生成
    currentQRCode = new QRCode(qrcodeElement, {
        text: wifiString,
        width: 260,
        height: 260,
        colorDark: '#3d2817',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    showNotification('QRコードを生成しました！');
}


// Wi-Fi情報を保存
function saveWiFi() {
    if (!currentWiFiData) {
        showNotification('先にQRコードを生成してください', 'error');
        return;
    }
    let savedWiFis = JSON.parse(localStorage.getItem('savedWiFis') || '[]');
    // 重複チェック
    const exists = savedWiFis.some(wifi => wifi.ssid === currentWiFiData.ssid);
    if (exists) {
        showNotification('このWi-Fiは既に保存されています', 'error');
        return;
    }
    savedWiFis.push(currentWiFiData);
    localStorage.setItem('savedWiFis', JSON.stringify(savedWiFis));
    loadSavedWiFis();
    showNotification('Wi-Fi情報を保存しました！');
}


// 保存済みWi-Fiを読み込み
function loadSavedWiFis() {
    const savedWiFis = JSON.parse(localStorage.getItem('savedWiFis') || '[]');
    const listElement = document.getElementById('saved-list');

    if (savedWiFis.length === 0) {
        listElement.innerHTML = '<p style="text-align: center; color: var(--color-text-muted); padding: 30px; font-size: 0.9rem;">保存されたWi-Fiはありません</p>';
        return;
    }
    listElement.innerHTML = savedWiFis.map((wifi, index) => `
        <div class="wifi-item" onclick="loadWiFi(${index})">
            <div class="wifi-info">
                <h3>${wifi.ssid}</h3>
                <p>セキュリティ： ${wifi.security === 'nopass' ? 'なし' : wifi.security}</p>
            </div>
            <div class="wifi-info-group">
                <button class="wifi-info-button" onclick="event.stopPropagation(); loadWiFi(${index})">
                    読込
                </button>
                <button class="wifi-info-button delete" onclick="event.stopPropagation(); deleteWiFi(${index})">
                    削除
                </button>
            </div>
        </div>
    `).join('');
}


// Wi-Fi情報を読み込み
function loadWiFi(index) {
    const savedWiFis = JSON.parse(localStorage.getItem('savedWiFis') || '[]');
    const wifi = savedWiFis[index];

    document.getElementById('ssid').value = wifi.ssid;
    document.getElementById('password').value = wifi.password;
    document.getElementById('security').value = wifi.security;
    generateQRCode();
    showNotification('Wi-Fi情報を読み込みました');
}


// Wi-Fi情報を削除
function deleteWiFi(index) {
    if (!confirm('このWi-Fi情報を削除しますか？')) return;

    let savedWiFis = JSON.parse(localStorage.getItem('savedWiFis') || '[]');
    savedWiFis.splice(index, 1);
    localStorage.setItem('savedWiFis', JSON.stringify(savedWiFis));
    loadSavedWiFis();
    showNotification('Wi-Fi情報を削除しました');
}


// QRコードをダウンロード
function downloadQRCode() {
    if (!currentQRCode) {
        showNotification('先にQRコードを生成してください', 'error');
        return;
    }
    const canvas = document.querySelector('#qrcode canvas');
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');

    link.download = `wifi-qr-${currentWiFiData.ssid}.png`;
    link.href = image;
    link.click();
    showNotification('QRコードをダウンロードしました！');
}


// 画面上のQRを印刷セクションへ同期
function syncPrintQRCode() {
    const printContainer = document.getElementById('print-qrcode');
    if (!printContainer) return;

    printContainer.innerHTML = '';
    const sourceCanvas = document.querySelector('#qrcode canvas');
    if (!sourceCanvas) return;

    const printImage = document.createElement('img');
    printImage.src = sourceCanvas.toDataURL('image/png');
    printImage.alt = 'Wi-Fi QRコード';
    printContainer.appendChild(printImage);
}


// 通知を表示
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    if (type === 'error') {
        notification.style.background = '#c17a4a';
    }
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}


window.addEventListener('beforeprint', syncPrintQRCode);

// ページ読み込み時に保存済みWi-Fiを表示
window.addEventListener('DOMContentLoaded', () => {
    loadSavedWiFis();
    setupMobileFormToggle();
});
