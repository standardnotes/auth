import { AuthMethods } from '@standardnotes/auth'

export type GetAuthMethodsResponse = {
  success: true,
  methods: AuthMethods,
}
