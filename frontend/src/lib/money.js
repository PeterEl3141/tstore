export const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
export const formatMoney = (minor) => gbp.format((minor || 0) / 100);
