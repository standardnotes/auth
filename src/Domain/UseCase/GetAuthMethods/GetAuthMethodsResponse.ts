import { Uuid } from '../../Uuid/Uuid'

export type GetAuthMethodsResponse = {
  success: true,
  methods: {
    // PR note: or a password could always be implied
    password: true,
    totp?: {
      uuid: Uuid,
    },
  },
} | {
  success: false,
  error: string,
}
