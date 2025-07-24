import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams, INodeOutputsValue } from '../../../src/Interface'

class Loop_Agentflow implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    color: string
    hideOutput: boolean
    hint: string
    baseClasses: string[]
    documentation?: string
    credential: INodeParams
    inputs: INodeParams[]
    outputs: INodeOutputsValue[]

    constructor() {
        this.label = 'Loop'
        this.name = 'loopAgentflow'
        this.version = 1.1
        this.type = 'Loop'
        this.category = 'Agent Flows'
        this.description = 'Loop back to a previous node'
        this.baseClasses = [this.type]
        this.color = '#FFA07A'
        this.hint = 'Make sure to have memory enabled in the LLM/Agent node to retain the chat history'
        this.hideOutput = false
        this.inputs = [
            {
                label: 'Loop Back To',
                name: 'loopBackToNode',
                type: 'asyncOptions',
                loadMethod: 'listPreviousNodes',
                freeSolo: true
            },
            {
                label: 'Max Loop Count',
                name: 'maxLoopCount',
                type: 'number',
                default: 5
            }
        ]
        this.outputs = [
            {
                label: 'Exhausted',
                name: 'exhausted',
                baseClasses: [this.type]
            }
        ]
    }

    //@ts-ignore
    loadMethods = {
        async listPreviousNodes(_: INodeData, options: ICommonObject): Promise<INodeOptionsValue[]> {
            const previousNodes = options.previousNodes as ICommonObject[]

            const returnOptions: INodeOptionsValue[] = []
            for (const node of previousNodes) {
                returnOptions.push({
                    label: node.label,
                    name: `${node.id}-${node.label}`,
                    description: node.id
                })
            }
            return returnOptions
        }
    }

    async run(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const loopBackToNode = nodeData.inputs?.loopBackToNode as string
        const _maxLoopCount = nodeData.inputs?.maxLoopCount as string
        const maxLoopCount = _maxLoopCount ? parseInt(_maxLoopCount) : 5

        const state = (options.agentflowRuntime?.state as ICommonObject) || {}
        const loopBackToNodeId = loopBackToNode?.split('-')[0] || ''
        const loopBackToNodeLabel = loopBackToNode?.split('-')[1] || ''

        // Create a unique key for this loop node's counter
        const loopCountKey = `__loopCount_${nodeData.id}`

        // Get current loop count for this specific loop node
        const currentLoopCount = state[loopCountKey] || 0

        // Check if we've reached the maximum loop count
        if (currentLoopCount >= maxLoopCount) {
            // Loop is exhausted - return result WITHOUT nodeID to prevent looping
            return {
                id: nodeData.id,
                name: this.name,
                output: {
                    content: `Loop exhausted after ${maxLoopCount} iterations`,
                    exhausted: true,
                    loopCount: currentLoopCount
                },
                state
            }
        } else {
            // Increment the loop counter for next iteration
            state[loopCountKey] = currentLoopCount + 1

            // Return normal loop output with nodeID to continue looping
            const data = {
                nodeID: loopBackToNodeId,
                maxLoopCount: maxLoopCount
            }

            return {
                id: nodeData.id,
                name: this.name,
                input: data,
                output: {
                    content: `Loop back to ${loopBackToNodeLabel} (${loopBackToNodeId}) - Iteration ${currentLoopCount + 1}`,
                    nodeID: loopBackToNodeId,
                    maxLoopCount: maxLoopCount,
                    loopCount: currentLoopCount + 1
                },
                state
            }
        }
    }
}

module.exports = { nodeClass: Loop_Agentflow }
