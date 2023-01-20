import { DefaultNamingStrategy } from "typeorm"

// Since typeorm require us to use ES6 and that migrating require a lot of work
// one solution is to override directly the one from typeorm so that there is no complain about
// the output build
DefaultNamingStrategy.prototype.eagerJoinRelationAlias = function (
  alias: string,
  propertyPath: string
): string {
  const path = propertyPath
    .split(".")
    .map((p) => p.substring(0, 2))
    .join("_")
  const out = alias + "_" + path
  const match = out.match(/_/g) || []
  return out + match.length
}

/*
export class ShortenedNamingStrategy extends DefaultNamingStrategy {
  eagerJoinRelationAlias(alias: string, propertyPath: string): string {
    const path = propertyPath
      .split(".")
      .map((p) => p.substring(0, 2))
      .join("_")
    const out = alias + "_" + path
    const match = out.match(/_/g) || []
    return out + match.length
  }
}
*/
