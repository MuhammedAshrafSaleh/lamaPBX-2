'use client'

import { useTranslation } from 'react-i18next'
import { useSelectedLayoutSegment } from 'next/navigation'
import classNames from '@/utils/classnames'

type ToolsNavProps = {
  className?: string
}

const ToolsNav = ({
  className,
}: ToolsNavProps) => {
  const { t } = useTranslation()
  const selectedSegment = useSelectedLayoutSegment()
  const activated = selectedSegment === 'tools'

  // قم بإزالة محتوى الـ return بالكامل، واستبدله بـ null
  return null
}

export default ToolsNav
