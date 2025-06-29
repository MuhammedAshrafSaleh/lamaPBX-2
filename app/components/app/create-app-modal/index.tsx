'use client'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { useContext, useContextSelector } from 'use-context-selector'
import { RiCommandLine, RiCornerDownLeftLine } from '@remixicon/react'
import { useDebounceFn, useKeyPress } from 'ahooks'
import AppIconPicker from '../../base/app-icon-picker'
import type { AppIconSelection } from '../../base/app-icon-picker'
import Button from '@/app/components/base/button'
import Divider from '@/app/components/base/divider'
import cn from '@/utils/classnames'
import AppsContext, { useAppContext } from '@/context/app-context'
import { useProviderContext } from '@/context/provider-context'
import { ToastContext } from '@/app/components/base/toast'
import type { AppMode } from '@/types/app'
import { createApp } from '@/service/apps'
import Input from '@/app/components/base/input'
import Textarea from '@/app/components/base/textarea'
import AppIcon from '@/app/components/base/app-icon'
import AppsFull from '@/app/components/billing/apps-full-in-dialog'
import { BubbleTextMod } from '@/app/components/base/icons/src/vender/solid/communication'
import { NEED_REFRESH_APP_LIST_KEY } from '@/config'
import { getRedirection } from '@/utils/app-redirection'
import FullScreenModal from '@/app/components/base/fullscreen-modal'

type CreateAppProps = {
  onSuccess: () => void
  onClose: () => void
  onCreateFromTemplate?: () => void
}

function CreateApp({ onClose, onSuccess, onCreateFromTemplate }: CreateAppProps) {
  const { t } = useTranslation()
  const { push } = useRouter()
  const { notify } = useContext(ToastContext)
  const mutateApps = useContextSelector(AppsContext, state => state.mutateApps)

  const [appMode, setAppMode] = useState<AppMode>('advanced-chat')
  const [appIcon, setAppIcon] = useState<AppIconSelection>({ type: 'emoji', icon: '🤖', background: '#FFEAD5' })
  const [showAppIconPicker, setShowAppIconPicker] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { plan, enableBilling } = useProviderContext()
  const isAppsFull = (enableBilling && plan.usage.buildApps >= plan.total.buildApps)
  const { isCurrentWorkspaceEditor } = useAppContext()

  const isCreatingRef = useRef(false)

  const onCreate = useCallback(async () => {
    if (!appMode) {
      notify({ type: 'error', message: t('app.newApp.appTypeRequired') })
      return
    }
    if (!name.trim()) {
      notify({ type: 'error', message: t('app.newApp.nameNotEmpty') })
      return
    }
    if (isCreatingRef.current)
      return
    isCreatingRef.current = true
    try {
      const app = await createApp({
        name,
        description,
        icon_type: appIcon.type,
        icon: appIcon.type === 'emoji' ? appIcon.icon : appIcon.fileId,
        icon_background: appIcon.type === 'emoji' ? appIcon.background : undefined,
        mode: appMode,
      })
      notify({ type: 'success', message: t('app.newApp.appCreated') })
      onSuccess()
      onClose()
      mutateApps()
      localStorage.setItem(NEED_REFRESH_APP_LIST_KEY, '1')
      getRedirection(isCurrentWorkspaceEditor, app, push)
    }
    catch (e) {
      notify({ type: 'error', message: t('app.newApp.appCreateFailed') })
    }
    isCreatingRef.current = false
  }, [name, notify, t, appMode, appIcon, description, onSuccess, onClose, mutateApps, push, isCurrentWorkspaceEditor])

  const { run: handleCreateApp } = useDebounceFn(onCreate, { wait: 300 })
  useKeyPress(['meta.enter', 'ctrl.enter'], () => {
    if (isAppsFull)
      return
    handleCreateApp()
  })

  return <>
    <div className='flex justify-center h-full overflow-y-auto overflow-x-hidden'>
      <div className='flex-1'>
        <div className='px-10 mx-auto max-w-4xl'>
          <div className='w-full h-6 2xl:h-[139px]' />
          <div className='pt-1 pb-6'>
            <span className='text-xl font-semibold text-gray-900'>{t('app.newApp.startFromBlank')}</span>
          </div>
          
          <div className='mb-6'>
            <div className='mb-3'>
              <span className='text-sm font-medium text-gray-700'>{t('app.newApp.chooseAppType')}</span>
            </div>
            <div className='flex flex-row gap-3'>
              <AppTypeCard
                beta
                active={appMode === 'advanced-chat'}
                title={t('app.types.advanced')}
                description={t('app.newApp.advancedShortDescription')}
                icon={<div className='w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center'>
                  <BubbleTextMod className='w-4 h-4 text-blue-600' />
                </div>}
                onClick={() => {
                  setAppMode('advanced-chat')
                }} 
              />
            </div>
          </div>

          <Divider className='my-6' />

          <div className='mb-6'>
            <div className='mb-3'>
              <span className='text-sm font-medium text-gray-700'>App Name & Icon</span>
            </div>
            <div className='flex space-x-3 items-center'>
              <div className='flex-1'>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('app.newApp.appNamePlaceholder') || ''}
                  className='w-full'
                />
              </div>
              <AppIcon
                iconType={appIcon.type}
                icon={appIcon.type === 'emoji' ? appIcon.icon : appIcon.fileId}
                background={appIcon.type === 'emoji' ? appIcon.background : undefined}
                imageUrl={appIcon.type === 'image' ? appIcon.url : undefined}
                size='xxl' 
                className='cursor-pointer rounded-2xl'
                onClick={() => { setShowAppIconPicker(true) }}
              />
              {showAppIconPicker && <AppIconPicker
                onSelect={(payload) => {
                  setAppIcon(payload)
                  setShowAppIconPicker(false)
                }}
                onClose={() => {
                  setShowAppIconPicker(false)
                }}
              />}
            </div>
          </div>

          <div className='mb-6'>
            <div className='mb-3'>
              <span className='text-sm font-medium text-gray-700'>Description (Optional)</span>
            </div>
            <Textarea
              className='w-full resize-none'
              placeholder={t('app.newApp.appDescriptionPlaceholder') || ''}
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className='pt-5 pb-10 flex justify-end items-center'>
            <div className='flex gap-2'>
              <Button 
                onClick={onClose}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50'
              >
                {t('app.newApp.Cancel')}
              </Button>
              <Button 
                disabled={isAppsFull || !name} 
                className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                onClick={handleCreateApp}
              >
                {t('app.newApp.Create')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    {
      isAppsFull && (
        <div className='px-8 py-2'>
          <AppsFull loc='app-create' />
        </div>
      )
    }
  </>
}

type CreateAppDialogProps = CreateAppProps & {
  show: boolean
}
const CreateAppModal = ({ show, onClose, onSuccess, onCreateFromTemplate }: CreateAppDialogProps) => {
  return (
    <FullScreenModal
      overflowVisible
      closable
      open={show}
      onClose={onClose}
    >
      <CreateApp onClose={onClose} onSuccess={onSuccess} onCreateFromTemplate={onCreateFromTemplate} />
    </FullScreenModal>
  )
}

export default CreateAppModal

type AppTypeCardProps = {
  icon: JSX.Element
  beta?: boolean
  title: string
  description: string
  active: boolean
  onClick: () => void
}
function AppTypeCard({ icon, title, beta = false, description, active, onClick }: AppTypeCardProps) {
  return (
    <div
      className={cn(
        `w-full p-4 border relative rounded-lg bg-white shadow-sm cursor-pointer transition-all`,
        active
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300'
      )}
      onClick={onClick}
    >
      {beta && (
        <div className='px-2 py-1 rounded-md absolute top-3 right-3 bg-gray-100 text-xs font-medium text-gray-600'>
          BETA
        </div>
      )}
      <div className='flex items-center'>
        {icon}
        <div className='ml-3'>
          <div className='text-sm font-medium text-gray-900'>{title}</div>
          <div className='text-xs text-gray-500 mt-1'>{description}</div>
        </div>
      </div>
    </div>
  )
}