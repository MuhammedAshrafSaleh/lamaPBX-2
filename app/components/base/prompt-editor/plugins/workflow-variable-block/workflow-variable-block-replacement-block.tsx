import {                          
  memo,
  useCallback,
  useEffect,
} from 'react'
import type { TextNode } from 'lexical'
import { $applyNodeReplacement } from 'lexical'
import { mergeRegister } from '@lexical/utils'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { decoratorTransform } from '../../utils'
import type { WorkflowVariableBlockType } from '../../types'
import { CustomTextNode } from '../custom-text/node'
import { $createWorkflowVariableBlockNode } from './node'
import { WorkflowVariableBlockNode } from './index'
import { VAR_REGEX as REGEX } from '@/config'

// تعريف دالة resetReg محلياً إذا لم تكن متوفرة من '@/config'
const resetReg = () => {
  if (REGEX) {
    REGEX.lastIndex = 0
  }
}

const WorkflowVariableBlockReplacementBlock = ({
  workflowNodesMap,
  onInsert,
}: WorkflowVariableBlockType) => {
  const [editor] = useLexicalComposerContext()

  // التحقق من تسجيل العقدة
  useEffect(() => {
    if (!editor.hasNodes([WorkflowVariableBlockNode])) {
      throw new Error(
        'WorkflowVariableBlockNodePlugin: WorkflowVariableBlockNode not registered on editor'
      )
    }
  }, [editor])

  // إنشاء عقدة متغير Workflow
  const createWorkflowVariableBlockNode = useCallback(
    (textNode: TextNode): WorkflowVariableBlockNode => {
      if (onInsert) {
        onInsert()
      }

      const nodePathString = textNode.getTextContent().slice(3, -3)
      return $applyNodeReplacement(
        $createWorkflowVariableBlockNode(
          nodePathString.split('.'),
          workflowNodesMap
        )
      )
    },
    [onInsert, workflowNodesMap]
  )

  // الحصول على التطابق للنص
  const getMatch = useCallback((text: string) => {
    resetReg() // إعادة تعيين REGEX قبل الاستخدام
    const matchArr = REGEX.exec(text)

    if (matchArr === null) {
      return null
    }

    return {
      start: matchArr.index,
      end: matchArr.index + matchArr[0].length,
    }
  }, [])

  // مستمع لتحويل النص
  const transformListener = useCallback(
    (textNode: TextNode) => {
      resetReg() // إعادة تعيين REGEX قبل التحويل
      return decoratorTransform(
        textNode,
        getMatch,
        createWorkflowVariableBlockNode
      )
    },
    [createWorkflowVariableBlockNode, getMatch]
  )

  // تسجيل التحويل
  useEffect(() => {
    resetReg() // إعادة تعيين REGEX عند التحميل
    return mergeRegister(
      editor.registerNodeTransform(CustomTextNode, transformListener)
    )
  }, [editor, transformListener])

  return null
}

export default memo(WorkflowVariableBlockReplacementBlock)