import type { CurrentBlob } from '@tractionfi/engine'

export interface UserStateRow {
  user_id: string
  blob: string         // JSON-stringified CurrentBlob
  version: number
  created_at: string
  updated_at: string
}

export interface UserStateParsed {
  user_id: string
  blob: CurrentBlob
  version: number
}
