export default async ({ container }) => {
  const storeService = container.resolve("storeService")
  const profileService = container.resolve("shippingProfileService")

  const entityManager = container.resolve("manager")

  console.log(storeService)

  await entityManager.transaction(async manager => {
    await storeService.withTransaction(manager).create()

    let payIds
    const pProviderService = container.resolve("paymentProviderService")
    const payProviders = container.resolve("paymentProviders")
    payIds = payProviders.map(p => p.getIdentifier())
    await pProviderService.registerInstalledProviders(payIds)

    let fulfilIds
    const fProviderService = container.resolve("fulfillmentProviderService")
    const fulfilProviders = container.resolve("fulfillmentProviders")
    fulfilIds = fulfilProviders.map(p => p.getIdentifier())
    await fProviderService.registerInstalledProviders(fulfilIds)

    await profileService.withTransaction(manager).createDefault()
    await profileService.withTransaction(manager).createGiftCardDefault()
  })
}
