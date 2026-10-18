export default defineEventHandler(async () => {
  return db.query.products.findMany({ with: { variants: true } })
})
