// PM2 yapılandırması: süreç çökerse veya VDS yeniden başlarsa bot + web kendiliğinden ayağa kalkar.
// Kurulum:  pm2 start deploy/ecosystem.config.js && pm2 save && pm2 startup   (çıktıdaki komutu çalıştır)
//
// Not: Asıl onarım uygulamanın içinde (bot/services/selfHealingService.js) süreci yeniden
// başlatmadan yapılır. Buradaki otomatik yeniden başlatma yalnızca EN SON çare olan dış emniyet ağıdır.
module.exports = {
  apps: [{
    name: 'sentara',
    script: 'haBoot.js', // HA_ENABLED=1 değilse doğrudan index.js'i çalıştırır,
    cwd: __dirname + '/..',
    // Tek örnek: iki kopya aynı anda çalışırsa bot her komuta/duyuruya iki kez cevap verir.
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_restarts: 1000000,           // pes etme
    exp_backoff_restart_delay: 1000, // çökme döngüsünde üstel bekleme (1 sn'den başlar)
    min_uptime: '30s',
    max_memory_restart: '1500M',     // bellek sızıntısında son çare; veriler kapanışta kaydedilir
    kill_timeout: 10000,             // SIGTERM sonrası saveStoreNow() için süre tanı
    time: true,
    env: { NODE_ENV: 'production' }
  }]
};
