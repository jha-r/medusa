export default async (req, res) => {
  const { discount_id, code } = req.params

  try {
    const discountService = req.scope.resolve("discountService")
    await discountService.deleteDynamicCode(discount_id, code)

    const discount = await discountService.retrieve(discount_id, {
      relations: ["discount_rule", "discount_rule.valid_for", "regions"],
    })

    res.status(200).json({ discount })
  } catch (err) {
    throw err
  }
}
