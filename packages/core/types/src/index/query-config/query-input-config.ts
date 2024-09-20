import { ObjectToIndexFields } from "./query-input-config-fields"
import { IndexFilters } from "./query-input-config-filters"
import { IndexOrderBy } from "./query-input-config-order-by"
import { IndexServiceEntryPoints } from "../index-service-entry-points"

export type IndexQueryConfig<TEntry extends string> = {
  fields: ObjectToIndexFields<
    IndexServiceEntryPoints[TEntry & keyof IndexServiceEntryPoints]
  > extends never
    ? string[]
    : ObjectToIndexFields<
        IndexServiceEntryPoints[TEntry & keyof IndexServiceEntryPoints]
      >[]
  filters?: IndexFilters<TEntry>
  joinFilters?: IndexFilters<TEntry>
  pagination?: {
    skip?: number
    take?: number
    order?: IndexOrderBy<TEntry>
  }
  keepFilteredEntities?: boolean
}

export type QueryFunctionReturnPagination = {
  skip?: number
  take?: number
  count: number
}

/**
 * The QueryResultSet presents a typed output for the
 * result returned by the index search engine, it doesnt narrow down the type
 * based on the intput fields.
 */
export type QueryResultSet<TEntry extends string> = {
  data: TEntry extends keyof IndexServiceEntryPoints
    ? IndexServiceEntryPoints[TEntry][]
    : any[]
  metadata?: QueryFunctionReturnPagination
}
