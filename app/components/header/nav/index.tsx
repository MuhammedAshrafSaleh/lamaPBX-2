'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'
import type { INavSelectorProps } from './nav-selector'
import NavSelector from './nav-selector'
import classNames from '@/utils/classnames'
import { ArrowNarrowLeft } from '@/app/components/base/icons/src/vender/line/arrows'
import { useStore as useAppStore } from '@/app/components/app/store'

type INavProps = {
  icon: React.ReactNode
  activeIcon?: React.ReactNode
  text: string
  activeSegment: string | string[]
  link: string
  isApp: boolean
} & INavSelectorProps

const Nav = ({
  icon,
  activeIcon,
  text,
  activeSegment,
  link,
  curNav,
  navs,
  createText,
  onCreate,
  onLoadmore,
  isApp,
}: INavProps) => {
  const setAppDetail = useAppStore(state => state.setAppDetail)
  const [hovered, setHovered] = useState(false)
  const segment = useSelectedLayoutSegment()
  const isActivated = Array.isArray(activeSegment) ? activeSegment.includes(segment!) : segment === activeSegment

  return (
    <div className='flex items-start space-y-2'>
      <Link href={link} className='w-full'>
        <div
          onClick={() => setAppDetail()}
          className={classNames(`
            flex items-start w-full px-2.5 py-2 cursor-pointer rounded-[10px]
            ${isActivated ? 'text-components-main-nav-nav-button-text-active bg-components-main-nav-nav-button-bg-active shadow-md font-semibold' : 'text-components-main-nav-nav-button-text'}
            ${curNav && isActivated && 'hover:bg-components-main-nav-nav-button-bg-active-hover'}
          `)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className=''>
            {
              (hovered && curNav)
                ? <ArrowNarrowLeft className='w-4 h-4' />
                : isActivated
                  ? activeIcon
                  : icon
            }
          </div>
          <div className="ml-2">{text}</div>
        </div>
      </Link>
      {
        curNav && isActivated && (
          <>
            <div className='font-light text-gray-300'>/</div>
            <NavSelector
              isApp={isApp}
              curNav={curNav}
              navs={navs}
              createText={createText}
              onCreate={onCreate}
              onLoadmore={onLoadmore}
            />
          </>
        )
      }
    </div>
  )
}

export default Nav
