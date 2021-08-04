import { UseCaseInterface } from '../UseCaseInterface'
import { inject, injectable } from 'inversify'
import TYPES from '../../../Bootstrap/Types'
import { RoleRepositoryInterface } from '../../Role/RoleRepositoryInterface'
import { GetUserFeaturesDto } from './GetUserFeaturesDto'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { GetUserFeaturesResponse } from './GetUserFeaturesResponse'
import { PermissionName, RoleName, SubscriptionName } from '@standardnotes/auth'
import { ComponentArea, ContentType, DockIconType, Feature, Flag } from '@standardnotes/features'
import { UserSubscription } from '../../User/UserSubscription'

// TODO: this will be removed once `Features` is available in `snjs` module
export const Features: Feature[] = [{
  name: 'Midnight',
  identifier: PermissionName.MidnightTheme,
  contentType: ContentType.Theme,
  version: '1.2.2',
  description: 'Elegant utilitarianism.',
  url: '#{url_prefix}/themes/midnight',
  downloadUrl: 'https://github.com/standardnotes/midnight-theme/archive/1.2.2.zip',
  marketingUrl: 'https://standardnotes.org/extensions/midnight',
  thumbnailUrl: 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/midnight-with-mobile.jpg',
  dockIcon: {
    type: DockIconType.Circle,
    backgroundColor: '#086DD6',
    foregroundColor: '#ffffff',
    borderColor: '#086DD6',
  },
},
{
  name: 'Futura',
  identifier: PermissionName.FuturaTheme,
  contentType: ContentType.Theme,
  version: '1.2.2',
  description: 'Calm and relaxed. Take some time off.',
  url: '#{url_prefix}/themes/futura',
  downloadUrl: 'https://github.com/standardnotes/futura-theme/archive/1.2.2.zip',
  marketingUrl: 'https://standardnotes.org/extensions/futura',
  thumbnailUrl: 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/futura-with-mobile.jpg',
  dockIcon: {
    type: DockIconType.Circle,
    backgroundColor: '#fca429',
    foregroundColor: '#ffffff',
    borderColor: '#fca429',
  },
},
{
  name: 'Solarized Dark',
  identifier: PermissionName.SolarizedDarkTheme,
  contentType: ContentType.Theme,
  version: '1.2.1',
  description: 'The perfect theme for any time.',
  url: '#{url_prefix}/themes/solarized-dark',
  downloadUrl: 'https://github.com/standardnotes/solarized-dark-theme/archive/1.2.1.zip',
  marketingUrl: 'https://standardnotes.org/extensions/solarized-dark',
  thumbnailUrl: 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/solarized-dark.jpg',
  dockIcon: {
    type: DockIconType.Circle,
    backgroundColor: '#2AA198',
    foregroundColor: '#ffffff',
    borderColor: '#2AA198',
  },
},
{
  name: 'Autobiography',
  identifier: PermissionName.AutobiographyTheme,
  contentType: ContentType.Theme,
  version: '1.0.0',
  description: 'A theme for writers and readers.',
  url: '#{url_prefix}/themes/autobiography',
  downloadUrl: 'https://github.com/standardnotes/autobiography-theme/archive/1.0.0.zip',
  marketingUrl: '',
  thumbnailUrl: 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/autobiography.jpg',
  flags: [Flag.New],
  dockIcon: {
    type: DockIconType.Circle,
    backgroundColor: '#9D7441',
    foregroundColor: '#ECE4DB',
    borderColor: '#9D7441',
  },
},
{
  name: 'Focus',
  identifier: PermissionName.FocusedTheme,
  contentType: ContentType.Theme,
  version: '1.2.3',
  description: 'For when you need to go in.',
  url: '#{url_prefix}/themes/focus',
  downloadUrl: 'https://github.com/standardnotes/focus-theme/archive/1.2.3.zip',
  marketingUrl: 'https://standardnotes.org/extensions/focused',
  thumbnailUrl: 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/focus-with-mobile.jpg',
  dockIcon: {
    type: DockIconType.Circle,
    backgroundColor: '#a464c2',
    foregroundColor: '#ffffff',
    borderColor: '#a464c2',
  },
},
{
  identifier: PermissionName.TitaniumTheme,
  name: 'Titanium',
  contentType: ContentType.Theme,
  version: '1.2.2',
  description: 'Light on the eyes, heavy on the spirit.',
  url: '#{url_prefix}/themes/titanium',
  downloadUrl: 'https://github.com/standardnotes/titanium-theme/archive/1.2.2.zip',
  marketingUrl: 'https://standardnotes.org/extensions/titanium',
  thumbnailUrl: 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/titanium-with-mobile.jpg',
  dockIcon: {
    type: DockIconType.Circle,
    backgroundColor: '#6e2b9e',
    foregroundColor: '#ffffff',
    borderColor: '#6e2b9e',
  },
},
{
  name: 'Bold Editor',
  identifier: PermissionName.BoldEditor,
  contentType: ContentType.Component,
  area: ComponentArea.Editor,
  version: '1.2.1',
  description: 'A simple and peaceful rich editor that helps you write and think clearly. Features FileSafe integration, so you can embed your encrypted images, videos, and audio recordings directly inline.',
  url: '#{url_prefix}/components/bold-editor',
  marketingUrl: '',
  thumbnailUrl: 'https://s3.amazonaws.com/standard-notes/screenshots/models/editors/bold.jpg',
  downloadUrl: 'https://github.com/standardnotes/bold-editor/archive/1.2.1.zip',
  flags: [Flag.New],
},
{
  identifier: PermissionName.PlusEditor,
  name: 'Plus Editor',
  contentType: ContentType.Component,
  area: ComponentArea.Editor,
  version: '1.5.0',
  description: 'From highlighting to custom font sizes and colors, to tables and lists, this editor is perfect for crafting any document.',
  url: '#{url_prefix}/components/plus-editor',
  downloadUrl: 'https://github.com/standardnotes/plus-editor/archive/1.5.0.zip',
  marketingUrl: 'https://standardnotes.org/extensions/plus-editor',
  thumbnailUrl: 'https://s3.amazonaws.com/standard-notes/screenshots/models/editors/plus-editor.jpg',
},
{
  identifier: PermissionName.MarkdownBasicEditor,
  name: 'Markdown Basic',
  contentType: ContentType.Component,
  area: ComponentArea.Editor,
  version: '1.4.0',
  description: 'A Markdown editor with dynamic split-pane preview.',
  url: '#{url_prefix}/components/simple-markdown-editor',
  downloadUrl: 'https://github.com/standardnotes/markdown-basic/archive/1.4.0.zip',
  marketingUrl: 'https://standardnotes.org/extensions/simple-markdown-editor',
  thumbnailUrl: 'https://s3.amazonaws.com/standard-notes/screenshots/models/editors/simple-markdown.jpg',
},
{
  identifier: PermissionName.MarkdownProEditor,
  name: 'Markdown Pro',
  contentType: ContentType.Component,
  area: ComponentArea.Editor,
  version: '1.3.14',
  description: 'A fully featured Markdown editor that supports live preview, a styling toolbar, and split pane support.',
  url: '#{url_prefix}/components/advanced-markdown-editor',
  downloadUrl: 'https://github.com/standardnotes/advanced-markdown-editor/archive/1.3.14.zip',
  marketingUrl: 'https://standardnotes.org/extensions/advanced-markdown',
  thumbnailUrl: 'https://s3.amazonaws.com/standard-notes/screenshots/models/editors/adv-markdown.jpg',
},
{
  identifier: PermissionName.MarkdownMinimistEditor,
  name: 'Markdown Minimist',
  contentType: ContentType.Component,
  area: ComponentArea.Editor,
  version: '1.3.7',
  description: 'A minimal Markdown editor with live rendering and in-text search via Ctrl/Cmd + F',
  url: '#{url_prefix}/components/minimal-markdown-editor',
  downloadUrl: 'https://github.com/standardnotes/minimal-markdown-editor/archive/1.3.7.zip',
  marketingUrl: 'https://standardnotes.org/extensions/minimal-markdown-editor',
  thumbnailUrl: 'https://s3.amazonaws.com/standard-notes/screenshots/models/editors/min-markdown.jpg',
},
{
  identifier: PermissionName.TaskEditor,
  name: 'Task Editor',
  contentType: ContentType.Component,
  area: ComponentArea.Editor,
  version: '1.3.7',
  description: 'A great way to manage short-term and long-term to-do\'s. You can mark tasks as completed, change their order, and edit the text naturally in place.',
  url: '#{url_prefix}/components/simple-task-editor',
  downloadUrl: 'https://github.com/standardnotes/simple-task-editor/archive/1.3.7.zip',
  marketingUrl: 'https://standardnotes.org/extensions/simple-task-editor',
  thumbnailUrl: 'https://s3.amazonaws.com/standard-notes/screenshots/models/editors/task-editor.jpg',
},
{
  identifier: PermissionName.CodeEditor,
  name: 'Code Editor',
  contentType: ContentType.Component,
  area: ComponentArea.Editor,
  version: '1.3.8',
  description: 'Syntax highlighting and convenient keyboard shortcuts for over 120 programming languages. Ideal for code snippets and procedures.',
  url: '#{url_prefix}/components/code-editor',
  downloadUrl: 'https://github.com/standardnotes/code-editor/archive/1.3.8.zip',
  marketingUrl: 'https://standardnotes.org/extensions/code-editor',
  thumbnailUrl: 'https://s3.amazonaws.com/standard-notes/screenshots/models/editors/code.jpg',
},
{
  identifier: PermissionName.TokenVaultEditor,
  name: 'TokenVault',
  contentType: ContentType.Component,
  area: ComponentArea.Editor,
  version: '2.0.1',
  description: 'Encrypt and protect your 2FA secrets for all your internet accounts. TokenVault handles your 2FA secrets so that you never lose them again, or have to start over when you get a new device.',
  url: '#{url_prefix}/components/token-vault',
  marketingUrl: '',
  downloadUrl: 'https://github.com/standardnotes/token-vault/archive/2.0.1.zip',
  thumbnailUrl: 'https://standard-notes.s3.amazonaws.com/screenshots/models/editors/token-vault.png',
  flags: [Flag.New],
},
{
  identifier: PermissionName.SheetsEditor,
  name: 'Secure Spreadsheets',
  contentType: ContentType.Component,
  area: ComponentArea.Editor,
  version: '1.4.0',
  description: 'A powerful spreadsheet editor with formatting and formula support. Not recommended for large data sets, as encryption of such data may decrease editor performance.',
  url: '#{url_prefix}/components/standard-sheets',
  marketingUrl: '',
  downloadUrl: 'https://github.com/standardnotes/secure-spreadsheets/archive/1.4.0.zip',
  thumbnailUrl: 'https://s3.amazonaws.com/standard-notes/screenshots/models/editors/spreadsheets.png',
},
{
  identifier: PermissionName.TwoFactorAuthManager,
  name: '2FA Manager',
  description: 'Configure two-factor authentication to add an extra level of security to your account.',
  version: '1.2.4',
  url: '#{url_prefix}/components/mfa-link',
  marketingUrl: '',
  downloadUrl: 'https://github.com/standardnotes/mfa-link/archive/1.2.4.zip',
  contentType: ContentType.Component,
  area: ComponentArea.Modal,
  noExpire: true,
  deletionWarning: 'Deleting 2FA Manager will not disable 2FA from your account. To disable 2FA, first open 2FA Manager, then follow the prompts.',
},
{
  identifier: PermissionName.TwoFactorAuth,
  name: '',
  description: '',
  version: '',
  url: '',
  marketingUrl: '',
  downloadUrl: '',
  contentType: ContentType.Component,
  area: ComponentArea.Modal,
},
{
  identifier: PermissionName.NoteHistoryUnlimited,
  name: '',
  description: '',
  version: '',
  url: '',
  marketingUrl: '',
  downloadUrl: '',
  contentType: ContentType.Component,
  area: ComponentArea.Modal,
},
{
  identifier: PermissionName.NoteHistory365Days,
  name: '',
  description: '',
  version: '',
  url: '',
  marketingUrl: '',
  downloadUrl: '',
  contentType: ContentType.Component,
  area: ComponentArea.Modal,
},
{
  identifier: PermissionName.NoteHistory30Days,
  name: '',
  description: '',
  version: '',
  url: '',
  marketingUrl: '',
  downloadUrl: '',
  contentType: ContentType.Component,
  area: ComponentArea.Modal,
},
{
  identifier: PermissionName.DailyEmailBackup,
  name: '',
  description: '',
  version: '',
  url: '',
  marketingUrl: '',
  downloadUrl: '',
  contentType: ContentType.Component,
  area: ComponentArea.Modal,
},
{
  identifier: PermissionName.DailyDropboxBackup,
  name: '',
  description: '',
  version: '',
  url: '',
  marketingUrl: '',
  downloadUrl: '',
  contentType: ContentType.Component,
  area: ComponentArea.Modal,
},
{
  identifier: PermissionName.DailyGDriveBackup,
  name: '',
  description: '',
  version: '',
  url: '',
  marketingUrl: '',
  downloadUrl: '',
  contentType: ContentType.Component,
  area: ComponentArea.Modal,
},
{
  identifier: PermissionName.DailyOneDriveBackup,
  name: '',
  description: '',
  version: '',
  url: '',
  marketingUrl: '',
  downloadUrl: '',
  contentType: ContentType.Component,
  area: ComponentArea.Modal,
},
{
  identifier: PermissionName.Files25GB,
  name: '',
  description: '',
  version: '',
  url: '',
  marketingUrl: '',
  downloadUrl: '',
  contentType: ContentType.Component,
  area: ComponentArea.Modal,
},
{
  identifier: PermissionName.Files5GB,
  name: '',
  description: '',
  version: '',
  url: '',
  marketingUrl: '',
  downloadUrl: '',
  contentType: ContentType.Component,
  area: ComponentArea.Modal,
},
{
  identifier: PermissionName.TagNesting,
  name: '',
  description: '',
  version: '',
  url: '',
  marketingUrl: '',
  downloadUrl: '',
  contentType: ContentType.Component,
  area: ComponentArea.Modal,
},
{
  identifier: PermissionName.Files,
  name: '',
  description: '',
  version: '',
  url: '',
  marketingUrl: '',
  downloadUrl: '',
  contentType: ContentType.Component,
  area: ComponentArea.Modal,
},
{
  identifier: PermissionName.CloudLink,
  name: '',
  description: '',
  version: '',
  url: '',
  marketingUrl: '',
  downloadUrl: '',
  contentType: ContentType.Component,
  area: ComponentArea.Modal,
},
{
  identifier: PermissionName.ListedCustomDomain,
  name: '',
  description: '',
  version: '',
  url: '',
  marketingUrl: '',
  downloadUrl: '',
  contentType: ContentType.Component,
  area: ComponentArea.Modal,
}] as never

@injectable()
export class GetUserFeatures implements UseCaseInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.RoleRepository) private roleRepository: RoleRepositoryInterface
  ) {
  }

  async execute(dto: GetUserFeaturesDto): Promise<GetUserFeaturesResponse> {
    const { userUuid } = dto

    const user = await this.userRepository.findOneByUuid(userUuid)

    if (user === undefined) {
      return {
        success: false,
        error: {
          message: `User ${userUuid} not found.`,
        },
      }
    }

    const userRoles = await user.roles
    const rolesNames = userRoles.map(role => role.name)

    const roles = await this.roleRepository.findAllByNames(rolesNames) || []

    const userSubscriptions = await user.subscriptions

    const features = await Promise.all(roles.map(async (role) => {
      const subscriptionName = this.roleNameToSubscriptionNameMap.get(role.name as RoleName)
      const expiresAt = (userSubscriptions.find(subscription => subscription.planName === subscriptionName) as UserSubscription).endsAt

      const permissions = await role.permissions
      const featuresWithExpirationDate = permissions.map(permission => {
        const featureItem = Features.find(feature => feature.identifier === permission.name)

        return {
          ...featureItem,
          expiresAt,
        }
      })

      return featuresWithExpirationDate
    }))

    return {
      success: true,
      userUuid,
      features: features.flat() as Feature[],
    }
  }

  private roleNameToSubscriptionNameMap = new Map<RoleName, SubscriptionName>([
    [RoleName.CoreUser, SubscriptionName.CorePlan],
    [RoleName.PlusUser, SubscriptionName.PlusPlan],
    [RoleName.ProUser, SubscriptionName.ProPlan],
  ]);
}
