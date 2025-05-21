import DB from './lib/db.js'
import { now } from './lib/util.js'

export { now }

export const create = DB.create
export const open = DB.open

export default { create, now, open }
