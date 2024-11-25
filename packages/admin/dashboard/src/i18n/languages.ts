import { de, enUS, es, pl, tr,zhCN } from "date-fns/locale"
import { Language } from "./types"

export const languages: Language[] = [
  {
    code: "en",
    display_name: "English",
    ltr: true,
    date_locale: enUS,
  },
  {
    code: "es",
    display_name: "Español",
    ltr: true,
    date_locale: es,
  },
  {
    code: "de",
    display_name: "Deutsch",
    ltr: true,
    date_locale: de,
  },
  {
    code: "pl",
    display_name: "Polski",
    ltr: true,
    date_locale: pl,
  },
  {
    code: "tr",
    display_name: "Türkçe",
    ltr: true,
    date_locale: tr,
  },
  {
    code: "zh",
    display_name: "Chinese",
    ltr: true,
    date_locale: zhCN,
  },
]
