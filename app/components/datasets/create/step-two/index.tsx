'use client'
import type { FC, PropsWithChildren } from 'react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useContext } from 'use-context-selector'
import {
  RiAlertFill,
  RiArrowLeftLine,
} from '@remixicon/react'
import Link from 'next/link'
import Image from 'next/image'
import SettingCog from '../assets/setting-gear-mod.svg'
import { indexMethodIcon } from '../icons'
import s from './index.module.css'
import unescape from './unescape'
import escape from './escape'
import { OptionCard } from './option-card'
import LanguageSelect from './language-select'
import { DelimiterInput, MaxLengthInput, OverlapInput } from './inputs'
import cn from '@/utils/classnames'
import type { CrawlOptions, CrawlResultItem, CreateDocumentReq, CustomFile, DocumentItem, FullDocumentDetail, ParentMode, PreProcessingRule, ProcessRule, Rules, createDocumentResponse } from '@/models/datasets'
import { ChunkingMode, DataSourceType, ProcessMode } from '@/models/datasets'
import Button from '@/app/components/base/button'
import RetrievalMethodConfig from '@/app/components/datasets/common/retrieval-method-config'
import EconomicalRetrievalMethodConfig from '@/app/components/datasets/common/economical-retrieval-method-config'
import { type RetrievalConfig } from '@/types/app'
import { isReRankModelSelected } from '@/app/components/datasets/common/check-rerank-model'
import Toast from '@/app/components/base/toast'
import type { NotionPage } from '@/models/common'
import { DataSourceProvider } from '@/models/common'
import { useDatasetDetailContext } from '@/context/dataset-detail'
import I18n from '@/context/i18n'
import { RETRIEVE_METHOD } from '@/types/app'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import { useDefaultModel, useModelList, useModelListAndDefaultModelAndCurrentProviderAndModel } from '@/app/components/header/account-setting/model-provider-page/hooks'
import { LanguagesSupported } from '@/i18n/language'
import ModelSelector from '@/app/components/header/account-setting/model-provider-page/model-selector'
import type { DefaultModel } from '@/app/components/header/account-setting/model-provider-page/declarations'
import { ModelTypeEnum } from '@/app/components/header/account-setting/model-provider-page/declarations'
import Checkbox from '@/app/components/base/checkbox'
import { FULL_DOC_PREVIEW_LENGTH, IS_CE_EDITION } from '@/config'
import Divider from '@/app/components/base/divider'
import { getNotionInfo, getWebsiteInfo, useCreateDocument, useCreateFirstDocument, useFetchDefaultProcessRule, useFetchFileIndexingEstimateForFile, useFetchFileIndexingEstimateForNotion, useFetchFileIndexingEstimateForWeb } from '@/service/knowledge/use-create-dataset'
import Badge from '@/app/components/base/badge'
import Tooltip from '@/app/components/base/tooltip'
import { AlertTriangle } from '@/app/components/base/icons/src/vender/solid/alertsAndFeedback'

const TextLabel: FC<PropsWithChildren> = (props) => {
  return <label className='text-text-secondary system-sm-semibold'>{props.children}</label>
}

type StepTwoProps = {
  isSetting?: boolean
  documentDetail?: FullDocumentDetail
  isAPIKeySet: boolean
  onSetting: () => void
  datasetId?: string
  indexingType?: IndexingType
  retrievalMethod?: string
  dataSourceType: DataSourceType
  files: CustomFile[]
  notionPages?: NotionPage[]
  websitePages?: CrawlResultItem[]
  crawlOptions?: CrawlOptions
  websiteCrawlProvider?: DataSourceProvider
  websiteCrawlJobId?: string
  onStepChange?: (delta: number) => void
  updateIndexingTypeCache?: (type: string) => void
  updateRetrievalMethodCache?: (method: string) => void
  updateResultCache?: (res: createDocumentResponse) => void
  onSave?: () => void
  onCancel?: () => void
}

export enum IndexingType {
  QUALIFIED = 'high_quality',
  ECONOMICAL = 'economy',
}

const DEFAULT_SEGMENT_IDENTIFIER = '\\n\\n'
const DEFAULT_MAXIMUM_CHUNK_LENGTH = 500
const DEFAULT_OVERLAP = 50

type ParentChildConfig = {
  chunkForContext: ParentMode
  parent: {
    delimiter: string
    maxLength: number
  }
  child: {
    delimiter: string
    maxLength: number
  }
}

const defaultParentChildConfig: ParentChildConfig = {
  chunkForContext: 'paragraph',
  parent: {
    delimiter: '\\n\\n',
    maxLength: 500,
  },
  child: {
    delimiter: '\\n',
    maxLength: 200,
  },
}

const StepTwo = ({
  isSetting,
  documentDetail,
  isAPIKeySet,
  datasetId,
  indexingType,
  dataSourceType: inCreatePageDataSourceType,
  files,
  notionPages = [],
  websitePages = [],
  crawlOptions,
  websiteCrawlProvider = DataSourceProvider.fireCrawl,
  websiteCrawlJobId = '',
  onStepChange,
  updateIndexingTypeCache,
  updateResultCache,
  onSave,
  onCancel,
  updateRetrievalMethodCache,
}: StepTwoProps) => {
  const { t } = useTranslation()
  const { locale } = useContext(I18n)
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile

  const { dataset: currentDataset, mutateDatasetRes } = useDatasetDetailContext()

  const isInUpload = Boolean(currentDataset)
  const isUploadInEmptyDataset = isInUpload && !currentDataset?.doc_form
  const isNotUploadInEmptyDataset = !isUploadInEmptyDataset
  const isInInit = !isInUpload && !isSetting

  const isInCreatePage = !datasetId || (datasetId && !currentDataset?.data_source_type)
  const dataSourceType = isInCreatePage ? inCreatePageDataSourceType : currentDataset?.data_source_type
  const [segmentationType, setSegmentationType] = useState<ProcessMode>(ProcessMode.general)
  const [segmentIdentifier, doSetSegmentIdentifier] = useState(DEFAULT_SEGMENT_IDENTIFIER)
  const setSegmentIdentifier = useCallback((value: string, canEmpty?: boolean) => {
    doSetSegmentIdentifier(value ? escape(value) : (canEmpty ? '' : DEFAULT_SEGMENT_IDENTIFIER))
  }, [])
  const [maxChunkLength, setMaxChunkLength] = useState(DEFAULT_MAXIMUM_CHUNK_LENGTH) // default chunk length
  const [limitMaxChunkLength, setLimitMaxChunkLength] = useState(4000)
  const [overlap, setOverlap] = useState(DEFAULT_OVERLAP)
  const [rules, setRules] = useState<PreProcessingRule[]>([])
  const [defaultConfig, setDefaultConfig] = useState<Rules>()
  const hasSetIndexType = !!indexingType
  
  const [indexType, setIndexType] = useState<IndexingType>(
    IndexingType.QUALIFIED
  ) 

  const [previewFile, setPreviewFile] = useState<DocumentItem>(
    (datasetId && documentDetail)
      ? documentDetail.file
      : files[0],
  )
  const [previewNotionPage, setPreviewNotionPage] = useState<NotionPage>(
    (datasetId && documentDetail)
      ? documentDetail.notion_page
      : notionPages[0],
  )

  const [previewWebsitePage, setPreviewWebsitePage] = useState<CrawlResultItem>(
    (datasetId && documentDetail)
      ? documentDetail.website_page
      : websitePages[0],
  )

  // QA Related
  // const [isQAConfirmDialogOpen, setIsQAConfirmDialogOpen] = useState(false)
  // const [docForm, setDocForm] = useState<ChunkingMode>(
  //   (datasetId && documentDetail) ? documentDetail.doc_form as ChunkingMode : ChunkingMode.text,
  // )
  // const [docLanguage, setDocLanguage] = useState<string>(
  //   (datasetId && documentDetail) ? documentDetail.doc_language : (locale !== LanguagesSupported[1] ? 'English' : 'Chinese'),
  // )
   const docForm = ChunkingMode.text;
   const docLanguage = locale !== LanguagesSupported[1] ? 'English' : 'Chinese';
   const [parentChildConfig, setParentChildConfig] = useState<ParentChildConfig>(defaultParentChildConfig)

  const getIndexing_technique = () => indexingType || indexType
  const currentDocForm = currentDataset?.doc_form || docForm

  const getProcessRule = (): ProcessRule => {
    if (currentDocForm === ChunkingMode.parentChild) {
      return {
        rules: {
          pre_processing_rules: rules,
          segmentation: {
            separator: unescape(
              parentChildConfig.parent.delimiter,
            ),
            max_tokens: parentChildConfig.parent.maxLength,
          },
          parent_mode: parentChildConfig.chunkForContext,
          subchunk_segmentation: {
            separator: unescape(parentChildConfig.child.delimiter),
            max_tokens: parentChildConfig.child.maxLength,
          },
        },
        mode: 'hierarchical',
      } as ProcessRule
    }
    return {
      rules: {
        pre_processing_rules: rules,
        segmentation: {
          separator: unescape(segmentIdentifier),
          max_tokens: maxChunkLength,
          chunk_overlap: overlap,
        },
      }, // api will check this. It will be removed after api refactored.
      mode: segmentationType,
    } as ProcessRule
  }

  const fileIndexingEstimateQuery = useFetchFileIndexingEstimateForFile({
    docForm: currentDocForm,
    docLanguage,
    dataSourceType: DataSourceType.FILE,
    files: previewFile
      ? [files.find(file => file.name === previewFile.name)!]
      : files,
    indexingTechnique: getIndexing_technique() as any,
    processRule: getProcessRule(),
    dataset_id: datasetId!,
  })
  const notionIndexingEstimateQuery = useFetchFileIndexingEstimateForNotion({
    docForm: currentDocForm,
    docLanguage,
    dataSourceType: DataSourceType.NOTION,
    notionPages: [previewNotionPage],
    indexingTechnique: getIndexing_technique() as any,
    processRule: getProcessRule(),
    dataset_id: datasetId || '',
  })

  const websiteIndexingEstimateQuery = useFetchFileIndexingEstimateForWeb({
    docForm: currentDocForm,
    docLanguage,
    dataSourceType: DataSourceType.WEB,
    websitePages: [previewWebsitePage],
    crawlOptions,
    websiteCrawlProvider,
    websiteCrawlJobId,
    indexingTechnique: getIndexing_technique() as any,
    processRule: getProcessRule(),
    dataset_id: datasetId || '',
  })

  const currentEstimateMutation = dataSourceType === DataSourceType.FILE
    ? fileIndexingEstimateQuery
    : dataSourceType === DataSourceType.NOTION
      ? notionIndexingEstimateQuery
      : websiteIndexingEstimateQuery

  const fetchEstimate = useCallback(() => {
    if (dataSourceType === DataSourceType.FILE)
      fileIndexingEstimateQuery.mutate()

    if (dataSourceType === DataSourceType.NOTION)
      notionIndexingEstimateQuery.mutate()

    if (dataSourceType === DataSourceType.WEB)
      websiteIndexingEstimateQuery.mutate()
  }, [dataSourceType, fileIndexingEstimateQuery, notionIndexingEstimateQuery, websiteIndexingEstimateQuery])

  const estimate
    = dataSourceType === DataSourceType.FILE
      ? fileIndexingEstimateQuery.data
      : dataSourceType === DataSourceType.NOTION
        ? notionIndexingEstimateQuery.data
        : websiteIndexingEstimateQuery.data

  const getRuleName = (key: string) => {
    if (key === 'remove_extra_spaces')
      return t('datasetCreation.stepTwo.removeExtraSpaces')

    if (key === 'remove_urls_emails')
      return t('datasetCreation.stepTwo.removeUrlEmails')

    if (key === 'remove_stopwords')
      return t('datasetCreation.stepTwo.removeStopwords')
  }
  const ruleChangeHandle = (id: string) => {
    const newRules = rules.map((rule) => {
      if (rule.id === id) {
        return {
          id: rule.id,
          enabled: !rule.enabled,
        }
      }
      return rule
    })
    setRules(newRules)
  }
  const resetRules = () => {
    if (defaultConfig) {
      setSegmentIdentifier(defaultConfig.segmentation.separator)
      setMaxChunkLength(defaultConfig.segmentation.max_tokens)
      setOverlap(defaultConfig.segmentation.chunk_overlap!)
      setRules(defaultConfig.pre_processing_rules)
    }
    setParentChildConfig(defaultParentChildConfig)
  }

  const {
    modelList: rerankModelList,
    defaultModel: rerankDefaultModel,
    currentModel: isRerankDefaultModelValid,
  } = useModelListAndDefaultModelAndCurrentProviderAndModel(ModelTypeEnum.rerank)
  const { data: embeddingModelList } = useModelList(ModelTypeEnum.textEmbedding)
  const { data: defaultEmbeddingModel } = useDefaultModel(ModelTypeEnum.textEmbedding)
  const [embeddingModel, setEmbeddingModel] = useState<DefaultModel>(
    currentDataset?.embedding_model
      ? {
        provider: currentDataset.embedding_model_provider,
        model: currentDataset.embedding_model,
      }
      : {
        provider: defaultEmbeddingModel?.provider.provider || '',
        model: defaultEmbeddingModel?.model || '',
      },
  )
  const [retrievalConfig, setRetrievalConfig] = useState(currentDataset?.retrieval_model_dict || {
    search_method: RETRIEVE_METHOD.hybrid,
    reranking_enable: false,
    reranking_model: {
      reranking_provider_name: '',
      reranking_model_name: '',
    },
    top_k: 3,
    score_threshold_enabled: false,
    score_threshold: 0.5,
  } as RetrievalConfig)

  useEffect(() => {
    if (currentDataset?.retrieval_model_dict)
      return
    setRetrievalConfig({
      search_method: RETRIEVE_METHOD.hybrid,
      reranking_enable: !!isRerankDefaultModelValid,
      reranking_model: {
        reranking_provider_name: isRerankDefaultModelValid ? rerankDefaultModel?.provider.provider ?? '' : '',
        reranking_model_name: isRerankDefaultModelValid ? rerankDefaultModel?.model ?? '' : '',
      },
      top_k: 3,
      score_threshold_enabled: false,
      score_threshold: 0.5,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rerankDefaultModel, isRerankDefaultModelValid])

  const getCreationParams = () => {
    let params
    if (segmentationType === ProcessMode.general && overlap > maxChunkLength) {
      Toast.notify({ type: 'error', message: t('datasetCreation.stepTwo.overlapCheck') })
      return
    }
    if (segmentationType === ProcessMode.general && maxChunkLength > limitMaxChunkLength) {
      Toast.notify({ type: 'error', message: t('datasetCreation.stepTwo.maxLengthCheck', { limit: limitMaxChunkLength }) })
      return
    }
    if (isSetting) {
      params = {
        original_document_id: documentDetail?.id,
        doc_form: currentDocForm,
        doc_language: docLanguage,
        process_rule: getProcessRule(),
        retrieval_model: retrievalConfig, // Readonly. If want to changed, just go to settings page.
        embedding_model: embeddingModel.model, // Readonly
        embedding_model_provider: embeddingModel.provider, // Readonly
        indexing_technique: getIndexing_technique(),
      } as CreateDocumentReq
    }
    else { // create
      const indexMethod = getIndexing_technique()
      if (
        !isReRankModelSelected({
          rerankModelList,
          retrievalConfig,
          indexMethod: indexMethod as string,
        })
      ) {
        Toast.notify({ type: 'error', message: t('appDebug.datasetConfig.rerankModelRequired') })
        return
      }
      params = {
        data_source: {
          type: dataSourceType,
          info_list: {
            data_source_type: dataSourceType,
          },
        },
        indexing_technique: getIndexing_technique(),
        process_rule: getProcessRule(),
        doc_form: currentDocForm,
        doc_language: docLanguage,
        retrieval_model: retrievalConfig,
        embedding_model: embeddingModel.model,
        embedding_model_provider: embeddingModel.provider,
      } as CreateDocumentReq
      if (dataSourceType === DataSourceType.FILE) {
        params.data_source.info_list.file_info_list = {
          file_ids: files.map(file => file.id || '').filter(Boolean),
        }
      }
      if (dataSourceType === DataSourceType.NOTION)
        params.data_source.info_list.notion_info_list = getNotionInfo(notionPages)

      if (dataSourceType === DataSourceType.WEB) {
        params.data_source.info_list.website_info_list = getWebsiteInfo({
          websiteCrawlProvider,
          websiteCrawlJobId,
          websitePages,
        })
      }
    }
    return params
  }

  const fetchDefaultProcessRuleMutation = useFetchDefaultProcessRule({
    onSuccess(data) {
      const separator = data.rules.segmentation.separator
      setSegmentIdentifier(separator)
      setMaxChunkLength(data.rules.segmentation.max_tokens)
      setOverlap(data.rules.segmentation.chunk_overlap!)
      setRules(data.rules.pre_processing_rules)
      setDefaultConfig(data.rules)
      setLimitMaxChunkLength(data.limits.indexing_max_segmentation_tokens_length)
    },
    onError(error) {
      Toast.notify({
        type: 'error',
        message: `${error}`,
      })
    },
  })

  const getRulesFromDetail = () => {
    if (documentDetail) {
      const rules = documentDetail.dataset_process_rule.rules
      const separator = rules.segmentation.separator
      const max = rules.segmentation.max_tokens
      const overlap = rules.segmentation.chunk_overlap
      setSegmentIdentifier(separator)
      setMaxChunkLength(max)
      setOverlap(overlap!)
      setRules(rules.pre_processing_rules)
      setDefaultConfig(rules)
    }
  }

  const getDefaultMode = () => {
    if (documentDetail)
      setSegmentationType(documentDetail.dataset_process_rule.mode)
  }

  const createFirstDocumentMutation = useCreateFirstDocument({
    onError(error) {
      Toast.notify({
        type: 'error',
        message: `${error}`,
      })
    },
  })
  const createDocumentMutation = useCreateDocument(datasetId!, {
    onError(error) {
      Toast.notify({
        type: 'error',
        message: `${error}`,
      })
    },
  })

  const isCreating = createFirstDocumentMutation.isPending || createDocumentMutation.isPending

  const createHandle = async () => {
    const params = getCreationParams()
    if (!params)
      return false

    if (!datasetId) {
      await createFirstDocumentMutation.mutateAsync(
        params,
        {
          onSuccess(data) {
            updateIndexingTypeCache && updateIndexingTypeCache(indexType as string)
            updateResultCache && updateResultCache(data)
            updateRetrievalMethodCache && updateRetrievalMethodCache(retrievalConfig.search_method as string)
          },
        },
      )
    }
    else {
      await createDocumentMutation.mutateAsync(params, {
        onSuccess(data) {
          updateIndexingTypeCache && updateIndexingTypeCache(indexType as string)
          updateResultCache && updateResultCache(data)
        },
      })
    }
    if (mutateDatasetRes)
      mutateDatasetRes()
    onStepChange && onStepChange(+1)
    isSetting && onSave && onSave()
  }

  useEffect(() => {
    // fetch rules
    if (!isSetting) {
      fetchDefaultProcessRuleMutation.mutate('/datasets/process-rule')
    }
    else {
      getRulesFromDetail()
      getDefaultMode()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // get indexing type by props
    if (indexingType)
      setIndexType(indexingType as IndexingType)

    else
      setIndexType(isAPIKeySet ? IndexingType.QUALIFIED : IndexingType.ECONOMICAL)
  }, [isAPIKeySet, indexingType, datasetId])

  

  const isModelAndRetrievalConfigDisabled = !!datasetId && !!currentDataset?.data_source_type

  return (
    <div className='flex w-full h-full'>
      <div className={cn('relative h-full w-[86%] py-6 overflow-y-auto', isMobile ? 'px-4' : 'px-12')}>
        <div className={'system-md-semibold mb-1'}>{t('datasetCreation.stepTwo.segmentation')}</div>
        {((isInUpload && [ChunkingMode.text, ChunkingMode.qa].includes(currentDataset!.doc_form))
          || isUploadInEmptyDataset
          || isInInit)
          && <OptionCard
            className='bg-background-section mb-2'
            title={t('datasetCreation.stepTwo.general')}
            icon={<Image width={20} height={20} src={SettingCog} alt={t('datasetCreation.stepTwo.general')} />}
            activeHeaderClassName='bg-dataset-option-card-blue-gradient'
            description={t('datasetCreation.stepTwo.generalTip')}
            isActive={
              [ChunkingMode.text, ChunkingMode.qa].includes(currentDocForm)
            }
            onSwitched={() =>
              handleChangeDocform(ChunkingMode.text)
            }
            actions={
              <>
                <Button variant={'ghost'} onClick={resetRules}>
                  {t('datasetCreation.stepTwo.reset')}
                </Button>
              </>
            }
            noHighlight={isInUpload && isNotUploadInEmptyDataset}
          >
            <div className='flex flex-col gap-y-4'>
              <div className='flex gap-3'>
                <DelimiterInput
                  value={segmentIdentifier}
                  onChange={e => setSegmentIdentifier(e.target.value, true)}
                />
                <MaxLengthInput
                  unit='tokens'
                  value={maxChunkLength}
                  onChange={setMaxChunkLength}
                />
                <OverlapInput
                  unit='tokens'
                  value={overlap}
                  min={1}
                  onChange={setOverlap}
                />
              </div>
              
            </div>
          </OptionCard>}

        <Divider className='my-5' />
        <div className={'system-md-semibold mb-1'}>{t('datasetCreation.stepTwo.indexMode')}</div>
        <div className='flex items-center gap-2'>
          {(!hasSetIndexType || (hasSetIndexType && indexingType === IndexingType.QUALIFIED)) && (
            <OptionCard className='flex-1'
              title={<div className='flex items-center'>
                {t('datasetCreation.stepTwo.qualified')}
                <Badge className={cn('ml-1 h-[18px]', (!hasSetIndexType && indexType === IndexingType.QUALIFIED) ? 'border-text-accent-secondary text-text-accent-secondary' : '')} uppercase>
                  {t('datasetCreation.stepTwo.recommend')}
                </Badge>
                <span className='ml-auto'>
                  {!hasSetIndexType && <span className={cn(s.radio)} />}
                </span>
              </div>}
              description={t('datasetCreation.stepTwo.qualifiedTip')}
              icon={<Image src={indexMethodIcon.high_quality} alt='' />}
              isActive={!hasSetIndexType && indexType === IndexingType.QUALIFIED}
              disabled={!isAPIKeySet || hasSetIndexType}
              onSwitched={() => {
                if (isAPIKeySet)
                  setIndexType(IndexingType.QUALIFIED)
              }}
            />
          )}
        </div>
       
        {/* Embedding model */}
        {indexType === IndexingType.QUALIFIED && (
          <div className='mt-5'>
            <div className={cn('system-md-semibold mb-1', datasetId && 'flex justify-between items-center')}>{t('datasetSettings.form.embeddingModel')}</div>
            <ModelSelector
              readonly={isModelAndRetrievalConfigDisabled}
              triggerClassName={isModelAndRetrievalConfigDisabled ? 'opacity-50' : ''}
              defaultModel={embeddingModel}
              modelList={embeddingModelList}
              onSelect={(model: DefaultModel) => {
                setEmbeddingModel(model)
              }}
            />
            {isModelAndRetrievalConfigDisabled && (
              <div className='mt-2 system-xs-medium'>
                {t('datasetCreation.stepTwo.indexSettingTip')}
                <Link className='text-text-accent' href={`/datasets/${datasetId}/settings`}>{t('datasetCreation.stepTwo.datasetSettingLink')}</Link>
              </div>
            )}
          </div>
        )}
        <Divider className='my-5' />
        {/* Retrieval Method Config */}
        <div>
          {!isModelAndRetrievalConfigDisabled
            ? (
              <div className={'mb-1'}>
                <div className='system-md-semibold mb-0.5'>{t('datasetSettings.form.retrievalSetting.title')}</div>
                <div className='body-xs-regular text-text-tertiary'>
                  <a target='_blank' rel='noopener noreferrer' href='https://docs.dify.ai/guides/knowledge-base/create-knowledge-and-upload-documents#id-4-retrieval-settings' className='text-text-accent'>{t('datasetSettings.form.retrievalSetting.learnMore')}</a>
                  {t('datasetSettings.form.retrievalSetting.longDescription')}
                </div>
              </div>
            )
            : (
              <div className={cn('system-md-semibold mb-0.5', 'flex justify-between items-center')}>
                <div>{t('datasetSettings.form.retrievalSetting.title')}</div>
              </div>
            )}

          <div className=''>
            {
              getIndexing_technique() === IndexingType.QUALIFIED
                ? (
                  <RetrievalMethodConfig
                    disabled={isModelAndRetrievalConfigDisabled}
                    value={retrievalConfig}
                    onChange={setRetrievalConfig}
                  />
                )
                : (
                  <EconomicalRetrievalMethodConfig
                    disabled={isModelAndRetrievalConfigDisabled}
                    value={retrievalConfig}
                    onChange={setRetrievalConfig}
                  />
                )
            }
          </div>
        </div>

        {!isSetting
          ? (
            <div className='flex items-center mt-8 py-2'>
              <Button onClick={() => onStepChange && onStepChange(-1)}>
                <RiArrowLeftLine className='w-4 h-4 mr-1' />
                {t('datasetCreation.stepTwo.previousStep')}
              </Button>
              <Button className='ml-auto' loading={isCreating} variant='primary' onClick={createHandle}>{t('datasetCreation.stepTwo.nextStep')}</Button>
            </div>
          )
          : (
            <div className='flex items-center mt-8 py-2'>
              {!datasetId && <Button loading={isCreating} variant='primary' onClick={createHandle}>{t('datasetCreation.stepTwo.save')}</Button>}
              <Button className='ml-2' onClick={onCancel}>{t('datasetCreation.stepTwo.cancel')}</Button>
            </div>
          )}
      </div>
     
    </div>
  )
}

export default StepTwo