import { UserTest } from './UserTest'

export const userWithSettings = UserTest.makeSubject({ 
  uuid: 'user-with-settings-uuid',
}, {
  settings: [
    { uuid: 'setting-1-uuid', name: 'setting-1-name' },
    { uuid: 'setting-2-uuid', name: 'setting-2-name' },
    { uuid: 'setting-3-uuid', name: 'setting-3-name' },
  ]
})
