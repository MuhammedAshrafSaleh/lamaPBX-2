import { useState } from 'react'
import { useContext } from 'use-context-selector'
import I18n from '@/context/i18n'
import { X } from '@/app/components/base/icons/src/vender/line/general'
import { NOTICE_I18N } from '@/i18n/language'

const MaintenanceNotice = () => {
  const { locale } = useContext(I18n)

  const [showNotice, setShowNotice] = useState(localStorage.getItem('hide-maintenance-notice') !== '1')
  const handleJumpNotice = () => {
    window.open(NOTICE_I18N.href, '_blank')
  }

  const handleCloseNotice = () => {
    localStorage.setItem('hide-maintenance-notice', '1')
    setShowNotice(false)
  }

  const titleByLocale: { [key: string]: string } = NOTICE_I18N.title
  const descByLocale: { [key: string]: string } = NOTICE_I18N.desc

  if (!showNotice)
    return null

  return (
    <div className='flex flex-col items-center p-4 w-full bg-[#FFFAEB] border-b border-[0.5px] border-b-[#FEF0C7] z-20'>
      <div className='flex items-center justify-center w-full mb-2 px-2 h-[32px] bg-[#F79009] text-white text-[13px] font-medium rounded-xl'>
        {titleByLocale[locale]}
      </div>
      {
        (NOTICE_I18N.href && NOTICE_I18N.href !== '#')
          ? <div className='text-sm font-medium text-gray-700 cursor-pointer text-center' onClick={handleJumpNotice}>{descByLocale[locale]}</div>
          : <div className='text-sm font-medium text-gray-700 text-center'>{descByLocale[locale]}</div>
      }
      <X className='w-5 h-5 text-gray-500 cursor-pointer mt-2' onClick={handleCloseNotice} />
    </div>
  )
}

export default MaintenanceNotice
