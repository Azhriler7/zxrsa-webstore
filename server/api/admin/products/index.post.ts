export default defineEventHandler(async (event) => {
  const body = await readBody<{
    id: string; name: string; description?: string; image?: string; promoBadge?: string
  }>(event)

  await db.insert(schema.products).values({
    id:          body.id,
    name:        body.name,
    description: body.description ?? null,
    image:       body.image       ?? null,
    promoBadge:  body.promoBadge  ?? null,
    isActive:    true,
  })

  return { ok: true }
})
