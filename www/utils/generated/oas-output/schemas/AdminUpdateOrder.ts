/**
 * @schema AdminUpdateOrder
 * type: object
 * description: SUMMARY
 * x-schemaName: AdminUpdateOrder
 * properties:
 *   email:
 *     type: string
 *     title: email
 *     description: The order's email.
 *     format: email
 *   shipping_address:
 *     type: object
 *     description: The order's shipping address.
 *     properties:
 *       first_name:
 *         type: string
 *         title: first_name
 *         description: The shipping address's first name.
 *       last_name:
 *         type: string
 *         title: last_name
 *         description: The shipping address's last name.
 *       phone:
 *         type: string
 *         title: phone
 *         description: The shipping address's phone.
 *       company:
 *         type: string
 *         title: company
 *         description: The shipping address's company.
 *       address_1:
 *         type: string
 *         title: address_1
 *         description: The shipping address's address 1.
 *       address_2:
 *         type: string
 *         title: address_2
 *         description: The shipping address's address 2.
 *       city:
 *         type: string
 *         title: city
 *         description: The shipping address's city.
 *       country_code:
 *         type: string
 *         title: country_code
 *         description: The shipping address's country code.
 *       province:
 *         type: string
 *         title: province
 *         description: The shipping address's province.
 *       postal_code:
 *         type: string
 *         title: postal_code
 *         description: The shipping address's postal code.
 *       metadata:
 *         type: object
 *         description: The shipping address's metadata.
 *   billing_address:
 *     type: object
 *     description: The order's billing address.
 *     properties:
 *       first_name:
 *         type: string
 *         title: first_name
 *         description: The billing address's first name.
 *       last_name:
 *         type: string
 *         title: last_name
 *         description: The billing address's last name.
 *       phone:
 *         type: string
 *         title: phone
 *         description: The billing address's phone.
 *       company:
 *         type: string
 *         title: company
 *         description: The billing address's company.
 *       address_1:
 *         type: string
 *         title: address_1
 *         description: The billing address's address 1.
 *       address_2:
 *         type: string
 *         title: address_2
 *         description: The billing address's address 2.
 *       city:
 *         type: string
 *         title: city
 *         description: The billing address's city.
 *       country_code:
 *         type: string
 *         title: country_code
 *         description: The billing address's country code.
 *       province:
 *         type: string
 *         title: province
 *         description: The billing address's province.
 *       postal_code:
 *         type: string
 *         title: postal_code
 *         description: The billing address's postal code.
 *       metadata:
 *         type: object
 *         description: The billing address's metadata.
 * 
*/

