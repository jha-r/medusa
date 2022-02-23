import { Type } from "class-transformer"
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator"
import { IsType } from "../utils/validators/is-type"

import { DateComparisonOperator, StringComparisonOperator } from "./common"

export class FilterableCustomerGroupProps {
  @IsOptional()
  @ValidateNested()
  @IsType([String, [String], StringComparisonOperator])
  id?: string | string[] | StringComparisonOperator

  @IsString()
  @IsOptional()
  q?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  name?: string[]

  @IsOptional()
  @ValidateNested()
  @Type(() => DateComparisonOperator)
  canceled_at?: DateComparisonOperator

  @IsOptional()
  @ValidateNested()
  @Type(() => DateComparisonOperator)
  created_at?: DateComparisonOperator
}
