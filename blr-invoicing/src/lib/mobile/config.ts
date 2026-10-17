/**
 * Licence settings of the ANDROID app. They must match the BaderProgLicense dashboard that generates the codes:
 * create a product with this product_id (bind type "device") and generate one code per phone.
 */
export const MOBILE_LICENSE = {
  server_url: "https://baderinfo.com/prog-license/api.php",
  public_key: "gLhupZMQXB/CGaa7uvQ5kjE55P2JYBTSc21bJqWrURQ=",
  product_id: "blr-fatourati-mobile",
  app_name: "BLR Fatourati",
  app_version: "1.0.0",
  check_interval_hours: 12,
  /** 0 = after one online activation the app works for life, even offline. */
  max_offline_days: 0,
  purchase_url: "https://baderinfo.com/",
};
export type MobileLicenseConfig = typeof MOBILE_LICENSE;
