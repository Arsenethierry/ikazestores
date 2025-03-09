
import { createLoader, parseAsBoolean, parseAsString } from 'nuqs/server'
 
export const pageSearchParams = {
  storeId: parseAsString.withDefault(''),
  createnew: parseAsBoolean.withDefault(false)
}
 
export const loadSearchParams = createLoader(pageSearchParams)