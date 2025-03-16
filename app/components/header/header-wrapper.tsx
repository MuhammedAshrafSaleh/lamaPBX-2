'use client'
import { usePathname } from 'next/navigation'
import s from './index.module.css'
import classNames from '@/utils/classnames'

type HeaderWrapperProps = {
  children: React.ReactNode
}

const HeaderWrapper = ({
  children,
}: HeaderWrapperProps) => {
  const pathname = usePathname()
  const isBordered = ['/apps', '/datasets', '/datasets/create', '/tools', '/account'].includes(pathname)

  return (
    <div className={classNames(
      //'sticky top-0 left-0 bottom-0 z-30 flex flex-row grow-0 shrink-0 basis-auto min-h-[56px]',
      'fixed top-0 left-0 bottom-0 z-30 flex flex-row grow-0 shrink-0 basis-auto w-52 h-screen bg-white shadow-md',
      s.header,
      isBordered ? 'border-r border-gray-200' : '',
    )}
    >
      {children}
    </div>
  )
}
export default HeaderWrapper     

//'fixed top-0 left-0 bottom-0 z-30 flex flex-row grow-0 shrink-0 basis-auto w-64 h-screen bg-white shadow-md',
//'fixed top-0 left-0 bottom-0 z-30 flex flex-row grow-0 shrink-0 basis-auto w-32 h-screen bg-white shadow-md', // تم تقليل العرض من w-64 إلى w-48