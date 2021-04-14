import { Uuid } from '../../Uuid/Uuid'

export type GetAuthMethodsResponse = {
  success: true,
  methods: {
    totp?: {
      uuid: Uuid,
    },
  },
} | {
  success: false,
  error: string,
}
