import { defaultAdminRegionRelations, defaultAdminRegionFields } from "."
import { Region } from "../../../.."
import RegionService from "../../../../services/region"

/**
 * @oas [delete] /regions/{id}/countries/{country_code}
 * operationId: "PostRegionsRegionCountriesCountry"
 * summary: "Remove Country"
 * description: "Removes a Country from the list of Countries in a Region"
 * parameters:
 *   - (path) id=* {string} The id of the Region.
 *   - (path) country_code=* {string} The 2 character ISO code for the Country.
 * tags:
 *   - Region
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             region:
 *               $ref: "#/components/schemas/region"
 */
export default async (req, res) => {
  const { region_id, country_code } = req.params

  const regionService: RegionService = req.scope.resolve("regionService")
  await regionService.removeCountry(region_id, country_code)

  const region: Region = await regionService.retrieve(region_id, {
    select: defaultAdminRegionFields,
    relations: defaultAdminRegionRelations,
  })

  res.json({ region })
}
