import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ModelSelector from '../model-selector'
import {
  useModelList,
  useSystemDefaultModelAndModelList,
  useUpdateModelList,
} from '../hooks'
import type {
  DefaultModel,
  DefaultModelResponse,
} from '../declarations'
import { ModelTypeEnum } from '../declarations'
import Tooltip from '@/app/components/base/tooltip'
import { Settings01 } from '@/app/components/base/icons/src/vender/line/general'
import {
  PortalToFollowElem,
  PortalToFollowElemContent,
  PortalToFollowElemTrigger,
} from '@/app/components/base/portal-to-follow-elem'
import Button from '@/app/components/base/button'
import { useProviderContext } from '@/context/provider-context'
import { updateDefaultModel } from '@/service/common'
import { useToastContext } from '@/app/components/base/toast'
import { useAppContext } from '@/context/app-context'

type SystemModelSelectorProps = {
  textGenerationDefaultModel: DefaultModelResponse | undefined
  embeddingsDefaultModel: DefaultModelResponse | undefined
  rerankDefaultModel: DefaultModelResponse | undefined
  speech2textDefaultModel: DefaultModelResponse | undefined
  ttsDefaultModel: DefaultModelResponse | undefined
}

// Enhanced Arrow Icon Component with smooth animation
const AnimatedArrow: FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <svg
    className={`w-3 h-3 text-gray-500 transition-transform duration-300 ease-in-out ${
      isOpen ? 'rotate-180' : 'rotate-0'
    }`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 9l6 6 6-6"
    />
  </svg>
)

const SystemModel: FC<SystemModelSelectorProps> = ({
  textGenerationDefaultModel,
  embeddingsDefaultModel,
  rerankDefaultModel,
  speech2textDefaultModel,
  ttsDefaultModel,
}) => {
  const { t } = useTranslation()
  const { notify } = useToastContext()
  const { isCurrentWorkspaceManager } = useAppContext()
  const { textGenerationModelList } = useProviderContext()
  const updateModelList = useUpdateModelList()
  const { data: embeddingModelList } = useModelList(ModelTypeEnum.textEmbedding)
  const { data: rerankModelList } = useModelList(ModelTypeEnum.rerank)
  const { data: speech2textModelList } = useModelList(ModelTypeEnum.speech2text)
  const { data: ttsModelList } = useModelList(ModelTypeEnum.tts)
  const [changedModelTypes, setChangedModelTypes] = useState<ModelTypeEnum[]>([])
  const [currentTextGenerationDefaultModel, changeCurrentTextGenerationDefaultModel] = useSystemDefaultModelAndModelList(textGenerationDefaultModel, textGenerationModelList)
  const [currentEmbeddingsDefaultModel, changeCurrentEmbeddingsDefaultModel] = useSystemDefaultModelAndModelList(embeddingsDefaultModel, embeddingModelList)
  const [currentRerankDefaultModel, changeCurrentRerankDefaultModel] = useSystemDefaultModelAndModelList(rerankDefaultModel, rerankModelList)
  const [currentSpeech2textDefaultModel, changeCurrentSpeech2textDefaultModel] = useSystemDefaultModelAndModelList(speech2textDefaultModel, speech2textModelList)
  const [currentTTSDefaultModel, changeCurrentTTSDefaultModel] = useSystemDefaultModelAndModelList(ttsDefaultModel, ttsModelList)
  const [open, setOpen] = useState(false)

  const getCurrentDefaultModelByModelType = (modelType: ModelTypeEnum) => {
    if (modelType === ModelTypeEnum.textGeneration)
      return currentTextGenerationDefaultModel
    else if (modelType === ModelTypeEnum.textEmbedding)
      return currentEmbeddingsDefaultModel
    else if (modelType === ModelTypeEnum.rerank)
      return currentRerankDefaultModel
    else if (modelType === ModelTypeEnum.speech2text)
      return currentSpeech2textDefaultModel
    else if (modelType === ModelTypeEnum.tts)
      return currentTTSDefaultModel

    return undefined
  }
  
  const handleChangeDefaultModel = (modelType: ModelTypeEnum, model: DefaultModel) => {
    if (modelType === ModelTypeEnum.textGeneration)
      changeCurrentTextGenerationDefaultModel(model)
    else if (modelType === ModelTypeEnum.textEmbedding)
      changeCurrentEmbeddingsDefaultModel(model)
    else if (modelType === ModelTypeEnum.rerank)
      changeCurrentRerankDefaultModel(model)
    else if (modelType === ModelTypeEnum.speech2text)
      changeCurrentSpeech2textDefaultModel(model)
    else if (modelType === ModelTypeEnum.tts)
      changeCurrentTTSDefaultModel(model)

    if (!changedModelTypes.includes(modelType))
      setChangedModelTypes([...changedModelTypes, modelType])
  }
  
  const handleSave = async () => {
    const res = await updateDefaultModel({
      url: '/workspaces/current/default-model',
      body: {
        model_settings: [ModelTypeEnum.textGeneration, ModelTypeEnum.textEmbedding, ModelTypeEnum.rerank, ModelTypeEnum.speech2text, ModelTypeEnum.tts].map((modelType) => {
          return {
            model_type: modelType,
            provider: getCurrentDefaultModelByModelType(modelType)?.provider,
            model: getCurrentDefaultModelByModelType(modelType)?.model,
          }
        }),
      },
    })
    if (res.result === 'success') {
      notify({ type: 'success', message: t('common.actionMsg.modifiedSuccessfully') })
      setOpen(false)

      changedModelTypes.forEach((modelType) => {
        if (modelType === ModelTypeEnum.textGeneration)
          updateModelList(modelType)
        else if (modelType === ModelTypeEnum.textEmbedding)
          updateModelList(modelType)
        else if (modelType === ModelTypeEnum.rerank)
          updateModelList(modelType)
        else if (modelType === ModelTypeEnum.speech2text)
          updateModelList(modelType)
        else if (modelType === ModelTypeEnum.tts)
          updateModelList(modelType)
      })
    }
  }

  return (
    <PortalToFollowElem
      open={open}
      onOpenChange={setOpen}
      placement='bottom-end'
      offset={{
        mainAxis: 4,
        crossAxis: 8,
      }}
    >
      <PortalToFollowElemTrigger onClick={() => setOpen(v => !v)}>
        <div className={`
          flex items-center justify-between px-2 h-6 text-xs text-gray-700 cursor-pointer bg-white rounded-md border-[0.5px] border-gray-200 shadow-xs
          hover:bg-gray-100 hover:shadow-none transition-all duration-200 ease-in-out
          ${open && 'bg-gray-100 shadow-none'}
        `}>
          <div className="flex items-center">
            <Settings01 className='mr-1 w-3 h-3 text-gray-500' />
            {t('common.modelProvider.systemModelSettings')}
          </div>
          <AnimatedArrow isOpen={open} />
        </div>
      </PortalToFollowElemTrigger>
      <PortalToFollowElemContent className='z-50'>
        <div className={`pt-4 w-[360px] rounded-xl border-[0.5px] border-black/5 bg-white shadow-xl transition-all duration-300 ease-out transform ${
          open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}>
          <div className='px-6 py-1'>
            <div className='flex items-center h-8 text-[13px] font-medium text-gray-900'>
              {t('common.modelProvider.systemReasoningModel.key')}
              <Tooltip
                popupContent={
                  <div className='w-[261px] text-gray-500'>
                    {t('common.modelProvider.systemReasoningModel.tip')}
                  </div>
                }
                triggerClassName='ml-0.5 w-4 h-4 shrink-0'
              />
            </div>
            <div>
              <ModelSelector
                defaultModel={currentTextGenerationDefaultModel}
                modelList={textGenerationModelList}
                onSelect={model => handleChangeDefaultModel(ModelTypeEnum.textGeneration, model)}
              />
            </div>
          </div>
          <div className='px-6 py-1'>
            <div className='flex items-center h-8 text-[13px] font-medium text-gray-900'>
              {t('common.modelProvider.embeddingModel.key')}
              <Tooltip
                popupContent={
                  <div className='w-[261px] text-gray-500'>
                    {t('common.modelProvider.embeddingModel.tip')}
                  </div>
                }
                triggerClassName='ml-0.5 w-4 h-4 shrink-0'
              />
            </div>
            <div>
              <ModelSelector
                defaultModel={currentEmbeddingsDefaultModel}
                modelList={embeddingModelList}
                onSelect={model => handleChangeDefaultModel(ModelTypeEnum.textEmbedding, model)}
              />
            </div>
          </div>
          <div className='px-6 py-1'>
            <div className='flex items-center h-8 text-[13px] font-medium text-gray-900'>
              {t('common.modelProvider.rerankModel.key')}
              <Tooltip
                popupContent={
                  <div className='w-[261px] text-gray-500'>
                    {t('common.modelProvider.rerankModel.tip')}
                  </div>
                }
                triggerClassName='ml-0.5 w-4 h-4 shrink-0'
              />
            </div>
            <div>
              <ModelSelector
                defaultModel={currentRerankDefaultModel}
                modelList={rerankModelList}
                onSelect={model => handleChangeDefaultModel(ModelTypeEnum.rerank, model)}
              />
            </div>
          </div>
          <div className='px-6 py-1'>
            <div className='flex items-center h-8 text-[13px] font-medium text-gray-900'>
              {t('common.modelProvider.speechToTextModel.key')}
              <Tooltip
                popupContent={
                  <div className='w-[261px] text-gray-500'>
                    {t('common.modelProvider.speechToTextModel.tip')}
                  </div>
                }
                triggerClassName='ml-0.5 w-4 h-4 shrink-0'
              />
            </div>
            <div>
              <ModelSelector
                defaultModel={currentSpeech2textDefaultModel}
                modelList={speech2textModelList}
                onSelect={model => handleChangeDefaultModel(ModelTypeEnum.speech2text, model)}
              />
            </div>
          </div>
          <div className='px-6 py-1'>
            <div className='flex items-center h-8 text-[13px] font-medium text-gray-900'>
              {t('common.modelProvider.ttsModel.key')}
              <Tooltip
                popupContent={
                  <div className='w-[261px] text-gray-500'>
                    {t('common.modelProvider.ttsModel.tip')}
                  </div>
                }
                triggerClassName='ml-0.5 w-4 h-4 shrink-0'
              />
            </div>
            <div>
              <ModelSelector
                defaultModel={currentTTSDefaultModel}
                modelList={ttsModelList}
                onSelect={model => handleChangeDefaultModel(ModelTypeEnum.tts, model)}
              />
            </div>
          </div>
          <div className='flex items-center justify-end px-6 py-4'>
            <Button
              onClick={() => setOpen(false)}
            >
              {t('common.operation.cancel')}
            </Button>
            <Button
              className='ml-2'
              variant='primary'
              onClick={handleSave}
              disabled={!isCurrentWorkspaceManager}
            >
              {t('common.operation.save')}
            </Button>
          </div>
        </div>
      </PortalToFollowElemContent>
    </PortalToFollowElem>
  )
}

export default SystemModel