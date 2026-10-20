/** Show removable example listings only in local development and Vercel Preview. */
export function demoCatalogEnabled() {
  return process.env.VERCEL_ENV === "preview" || (process.env.NODE_ENV === "development" && !process.env.VERCEL_ENV);
}
