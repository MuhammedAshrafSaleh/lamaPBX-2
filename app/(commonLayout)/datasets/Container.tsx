'use client'

// Libraries
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useDebounceFn } from 'ahooks'
import { useQuery } from '@tanstack/react-query'

// Components
import Datasets from './Datasets'
import DatasetFooter from './DatasetFooter'
import TabSliderNew from '@/app/components/base/tab-slider-new'
import TagManagementModal from '@/app/components/base/tag-management'
import Input from '@/app/components/base/input'

// Services
import { fetchDatasetApiBaseUrl } from '@/service/datasets'

// Hooks
import { useTabSearchParams } from '@/hooks/use-tab-searchparams'
import { useStore as useTagStore } from '@/app/components/base/tag-management/store'
import { useAppContext } from '@/context/app-context'
import ModelProviderPage from '@/app/components/model-provider-page'

const Container = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { currentWorkspace, isCurrentWorkspaceOwner } = useAppContext()
  const showTagManagementModal = useTagStore(s => s.showTagManagementModal)

  const options = useMemo(() => {
    return [
      { value: 'dataset', text: t('dataset.datasets') },
      // { value: 'model-provider', text: t('modelProvider.modelProviders') },
    ]
  }, [t])

  const [activeTab, setActiveTab] = useTabSearchParams({
    defaultTab: 'dataset',
  })
  const containerRef = useRef<HTMLDivElement>(null)

  const [keywords, setKeywords] = useState('')
  const [searchKeywords, setSearchKeywords] = useState('')
  const { run: handleSearch } = useDebounceFn(() => {
    setSearchKeywords(keywords)
  }, { wait: 500 })
  const handleKeywordsChange = (value: string) => {
    setKeywords(value)
    handleSearch()
  }

  useEffect(() => {
    if (currentWorkspace.role === 'normal')
      return router.replace('/apps')
  }, [currentWorkspace, router])

  return (
    <div ref={containerRef} className='grow relative flex flex-col bg-background-body overflow-y-auto scroll-container'>
      <div className='sticky top-0 flex justify-between pt-4 px-12 pb-2 leading-[56px] bg-background-body z-10 flex-wrap gap-y-2'>
        <TabSliderNew
          value={activeTab}
          onChange={newActiveTab => setActiveTab(newActiveTab)}
          options={options}
        />
        {activeTab === 'dataset' && (
          <Input
            showLeftIcon
            showClearIcon
            wrapperClassName='w-[200px]'
            value={keywords}
            onChange={e => handleKeywordsChange(e.target.value)}
            onClear={() => handleKeywordsChange('')}
          />
        )}
      </div>
      {activeTab === 'dataset' && (
        <>
          <Datasets containerRef={containerRef} tags={[]} keywords={searchKeywords} includeAll={false} />
          <DatasetFooter />
          {showTagManagementModal && (
            <TagManagementModal type='knowledge' show={showTagManagementModal} />
          )}
        </>
      )}
      {/* {activeTab === 'model-provider' && (
        <ModelProviderPage />
      )} */}
    </div>
  )
}

export default Container
