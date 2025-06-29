'use client'

import { forwardRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CreateAppModal from '@/app/components/app/create-app-modal'
import { useProviderContext } from '@/context/provider-context'
import { FilePlus01 } from '@/app/components/base/icons/src/vender/line/files'
import cn from '@/utils/classnames'

export type CreateAppCardProps = {
  className?: string
  onSuccess?: () => void
}

const CreateAppCard = forwardRef<HTMLDivElement, CreateAppCardProps>(({ className, onSuccess }, ref) => {
  const { t } = useTranslation()
  const { onPlanInfoChanged } = useProviderContext()

  const [showNewAppModal, setShowNewAppModal] = useState(false)

  return (
    <div
      ref={ref}
      className={cn('relative col-span-1 inline-flex flex-col justify-between h-[160px] bg-components-card-bg rounded-xl border-[0.5px] border-components-card-border', className)}
    >
      <div className='grow p-2 rounded-t-xl'>
        <div className='px-6 pt-2 pb-1 text-xs font-medium leading-[18px] text-text-tertiary'>{t('app.createApp')}</div>
        <button 
          className='w-full flex items-center px-6 py-[7px] rounded-lg text-[13px] font-medium leading-[18px] text-text-tertiary cursor-pointer hover:text-text-secondary hover:bg-state-base-hover' 
          onClick={() => setShowNewAppModal(true)}
        >
          <FilePlus01 className='shrink-0 mr-2 w-4 h-4' />
          {t('app.newApp.startFromBlank')}
        </button>
      </div>

      <CreateAppModal
        show={showNewAppModal}
        onClose={() => setShowNewAppModal(false)}
        onSuccess={() => {
          onPlanInfoChanged()
          if (onSuccess)
            onSuccess()
        }}
      />
    </div>
  )
})

CreateAppCard.displayName = 'CreateAppCard'
export default CreateAppCard
export { CreateAppCard }