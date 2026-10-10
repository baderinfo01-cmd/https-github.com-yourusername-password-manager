/**
 * Bader License — settings of YOUR program.
 * Fill product_id from the dashboard (Products page). The other values are ready.
 * You may edit this file; do NOT edit device-id.js or license.js.
 */
module.exports = {
    // Activation API of the software license dashboard
    server_url: 'https://baderinfo.com/apps-license/api.php',

    // Public key of the dashboard (Settings > Technical info). Fingerprint CC17-3F8E-2CC1-B18A
    public_key: 'bTDl7RfL5wVrjzJylOaiyg8V55+70R9tlDJX3IMg/kI=',

    // Product id exactly as in the dashboard > Products (bind type must be "device")
    product_id: 'bader-account-management',

    // Shown on the activation window
    app_name: 'Bader Account Management',

    // Ask the server every N hours; stop after N days without any successful check (0 = never stop)
    check_interval_hours: 12,
    // 0 = never stop: after one online activation the program works for life, even with no internet.
    // (the server is still asked every check_interval_hours whenever the device happens to be online,
    //  so a cancelled/refunded license is still revoked the next time it connects)
    max_offline_days: 0,

    // Activation window language: ar | fr | en
    lang: 'ar',

    purchase_url: 'https://baderinfo.com/',

    // Leave this out to use Electron's per-user data folder (recommended).
    // dev_mode is automatic: true with `npm run dev`, false in the built .exe.
};
