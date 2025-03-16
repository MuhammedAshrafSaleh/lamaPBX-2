'use client'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiArrowRightLine, RiFolder6Line } from '@remixicon/react'
import FilePreview from '../file-preview'
import FileUploader from '../file-uploader'
import EmptyDatasetCreationModal from '../empty-dataset-creation-modal'
import s from './index.module.css'
import cn from '@/utils/classnames'
import type { FileItem } from '@/models/datasets'
import { DataSourceType } from '@/models/datasets'
import Button from '@/app/components/base/button'
import { useDatasetDetailContext } from '@/context/dataset-detail'
import { useProviderContext } from '@/context/provider-context'
import VectorSpaceFull from '@/app/components/billing/vector-space-full'
import classNames from '@/utils/classnames'

type IStepOneProps = {
  datasetId?: string
  dataSourceType?: DataSourceType
  dataSourceTypeDisable: Boolean
  onSetting: () => void
  files: FileItem[]
  updateFileList: (files: FileItem[]) => void
  updateFile: (fileItem: FileItem, progress: number, list: FileItem[]) => void
  onStepChange: () => void
  changeType: (type: DataSourceType) => void
}

const StepOne = ({
  datasetId,
  dataSourceType: inCreatePageDataSourceType,
  dataSourceTypeDisable,
  changeType,
  onSetting,
  onStepChange,
  files,
  updateFileList,
  updateFile,
}: IStepOneProps) => {
  const { dataset } = useDatasetDetailContext()
  const [showModal, setShowModal] = useState(false)
  const [currentFile, setCurrentFile] = useState<File | undefined>()
  const { t } = useTranslation()

  const modalShowHandle = () => setShowModal(true)
  const modalCloseHandle = () => setShowModal(false)

  const updateCurrentFile = (file: File) => {
    setCurrentFile(file)
  }
  const hideFilePreview = () => {
    setCurrentFile(undefined)
  }

  const shouldShowDataSourceTypeList = !datasetId || (datasetId && !dataset?.data_source_type)
  const isInCreatePage = shouldShowDataSourceTypeList
  const dataSourceType = isInCreatePage ? inCreatePageDataSourceType : dataset?.data_source_type
  const { plan, enableBilling } = useProviderContext()
  const allFileLoaded = (files.length > 0 && files.every(file => file.file.id))
  const isVectorSpaceFull = plan.usage.vectorSpace >= plan.total.vectorSpace
  const isShowVectorSpaceFull = allFileLoaded && isVectorSpaceFull && enableBilling
  const notSupportBatchUpload = enableBilling && plan.type === 'sandbox'
  const nextDisabled = useMemo(() => {
    if (!files.length)
      return true
    if (files.some(file => !file.file.id))
      return true
    if (isShowVectorSpaceFull)
      return true
    return false
  }, [files, isShowVectorSpaceFull])

  return (
    <div className='flex w-full h-full justify-center items-center pl-[20px] pr-[20px]'>
      <div className='w-[65%] h-full overflow-y-auto relative'>
        <div className='flex justify-end'>
          <div className={classNames(s.form)} >
            {
              shouldShowDataSourceTypeList && (
                <div className={classNames(s.stepHeader, 'z-10 text-text-secondary bg-components-panel-bg-blur')}>{t('datasetCreation.steps.one')}</div>
              )
            }
            {
              shouldShowDataSourceTypeList && (
                <div className='flex items-center mb-8 flex-wrap gap-4'>
                  <div
                    className={cn(
                      s.dataSourceItem,
                      dataSourceType === DataSourceType.FILE && s.active,
                      dataSourceTypeDisable && dataSourceType !== DataSourceType.FILE && s.disabled,
                    )}
                    onClick={() => {
                      if (dataSourceTypeDisable)
                        return
                      changeType(DataSourceType.FILE)
                      hideFilePreview()
                    }}
                  >
                    <span className={cn(s.datasetIcon)} />
                    {t('datasetCreation.stepOne.dataSourceType.file')}
                  </div>
                </div>
              )
            }
            {dataSourceType === DataSourceType.FILE && (
              <>
                <FileUploader
                  fileList={files}
                  titleClassName={!shouldShowDataSourceTypeList ? 'mt-[30px] !mb-[44px] !text-lg !font-semibold !text-gray-900' : undefined}
                  prepareFileList={updateFileList}
                  onFileListUpdate={updateFileList}
                  onFileUpdate={updateFile}
                  onPreview={updateCurrentFile}
                  notSupportBatchUpload={notSupportBatchUpload}
                />
                {isShowVectorSpaceFull && (
                  <div className='max-w-[640px] mb-4'>
                    <VectorSpaceFull />
                  </div>
                )}
                <div className="flex justify-end gap-2 max-w-[640px]">
                  <Button disabled={nextDisabled} variant='primary' onClick={onStepChange}>
                    <span className="flex gap-0.5 px-[10px]">
                      <span className="px-0.5">{t('datasetCreation.stepOne.button')}</span>
                      <RiArrowRightLine className="size-4" />
                    </span>
                  </Button>
                </div>
              </>
            )}
            {!datasetId && (
              <>
                <div className={s.dividerLine} />
                <span className="inline-flex items-center cursor-pointer text-[13px] leading-4 text-text-accent" onClick={modalShowHandle}>
                  <RiFolder6Line className="size-4 mr-1" />
                  {t('datasetCreation.stepOne.emptyDatasetCreation')}
                </span>
              </>
            )}
          </div>
          <EmptyDatasetCreationModal show={showModal} onHide={modalCloseHandle} />
        </div>
      </div>
      <div className='w-[35%] h-full overflow-y-auto'>
        {currentFile && <FilePreview file={currentFile} hidePreview={hideFilePreview} />}
      </div>
    </div>
  )
}

export default StepOne