import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { Tool } from '@langchain/core/tools'
import axios from 'axios'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

class BrowserUseTool extends Tool {
    name = 'browser_use'
    description =
        'An AI browser agent that can perform complex, multi-step tasks on the web. Use this for any task that requires web browsing, navigation, interaction (clicking, filling forms, etc.), or data extraction from websites. Input should be a detailed task description.'

    private apiKey: string
    private llmModel?: string
    private maxAgentSteps?: number
    private pollingIntervalMs: number
    private pollingTimeoutMs: number
    private sessionOptions?: object

    constructor(
        apiKey: string,
        options: {
            llmModel?: string
            maxAgentSteps?: number
            sessionOptions?: object
            pollingIntervalMs?: number
            pollingTimeoutMs?: number
        }
    ) {
        super()
        this.apiKey = apiKey
        this.llmModel = options.llmModel
        this.maxAgentSteps = options.maxAgentSteps
        this.sessionOptions = options.sessionOptions
        this.pollingIntervalMs = options.pollingIntervalMs || 2000
        this.pollingTimeoutMs = options.pollingTimeoutMs || 180000
    }

    private async getFileDownloadUrl(taskId: string, fileName: string): Promise<string> {
        try {
            const response = await axios.get(`https://api.browser-use.com/api/v1/task/${taskId}/output-file/${fileName}`, {
                headers: { Authorization: `Bearer ${this.apiKey}` }
            })
            return response.data.download_url
        } catch (error: any) {
            console.error(`Error getting download URL for file ${fileName}:`, error)
            throw error
        }
    }

    async _call(input: any): Promise<string> {
        let task: string
        let dynamicSessionOptions: any | undefined

        if (input === null || input === undefined) {
            return 'Error: Input task cannot be empty.'
        }

        if (typeof input === 'object' && input.task) {
            task = input.task
            dynamicSessionOptions = input.session_options
        } else if (typeof input === 'string') {
            task = input
        } else {
            return 'Error: Invalid input. Please provide a task as a string or an object with a "task" key.'
        }

        if (!task) {
            return 'Error: Input task cannot be empty.'
        }

        try {
            const requestBody: { task: string; llm_model?: string; max_agent_steps?: number; session_options: any } = {
                task: task,
                llm_model: this.llmModel,
                max_agent_steps: this.maxAgentSteps,
                session_options: { ...this.sessionOptions, ...dynamicSessionOptions }
            }

            if (!requestBody.llm_model) delete requestBody.llm_model
            if (!requestBody.max_agent_steps) delete requestBody.max_agent_steps
            if (Object.keys(requestBody.session_options).length === 0) {
                delete requestBody.session_options
            }

            const startResponse = await axios.post('https://api.browser-use.com/api/v1/run-task', requestBody, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            })

            const taskId = startResponse.data?.id
            if (!taskId) {
                return `Error: Failed to start task. API response: ${JSON.stringify(startResponse.data)}`
            }

            const startTime = Date.now()
            while (Date.now() - startTime < this.pollingTimeoutMs) {
                const detailsResponse = await axios.get(`https://api.browser-use.com/api/v1/task/${taskId}`, {
                    headers: { Authorization: `Bearer ${this.apiKey}` }
                })

                const responseData = detailsResponse.data
                const taskStatus = responseData?.status?.toLowerCase()

                if (['finished', 'failed', 'stopped'].includes(taskStatus)) {
                    if (taskStatus === 'failed') {
                        return `Error: Browser-Use task failed: ${responseData.error || 'Unknown error.'}`
                    }
                    if (taskStatus === 'stopped') {
                        return `Task was manually stopped. Final output: ${responseData.output || 'No final output was generated.'}`
                    }

                    const outputText = responseData.output
                    const outputFiles = responseData.output_files
                    let finalResult = ''

                    if (outputText) {
                        finalResult += outputText
                    }
                    if (outputFiles && Array.isArray(outputFiles) && outputFiles.length > 0) {
                        finalResult += '\n\nThe agent generated the following files:'
                        for (const fileName of outputFiles) {
                            try {
                                const downloadUrl = await this.getFileDownloadUrl(taskId, fileName)
                                finalResult += `\n- ${fileName}: ${downloadUrl}`
                            } catch (error) {
                                finalResult += `\n- ${fileName}: (Error getting download URL)`
                            }
                        }
                    }
                    return finalResult.trim() || 'Task finished successfully but returned no specific text output or files.'
                }

                await sleep(this.pollingIntervalMs)
            }

            return `Error: Task polling timed out after ${this.pollingTimeoutMs / 1000} seconds. The task may still be running.`
        } catch (error: any) {
            console.error('Error calling Browser-Use API:', error)

            if (error.response) {
                const status = error.response.status
                const data = error.response.data
                const errorMessage = data?.error || data?.message || JSON.stringify(data)
                return `An error occurred while running the Browser-Use agent: API responded with status ${status} - ${errorMessage}`
            } else if (error.request) {
                return `An error occurred while running the Browser-Use agent: No response received from server. Check network connectivity.`
            } else {
                return `An error occurred while running the Browser-Use agent: ${error.message}`
            }
        }
    }
}

class BrowserUse_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Browser Use'
        this.name = 'browserUse'
        this.version = 1.0
        this.type = 'Tool'
        this.icon = 'browseruse.png'
        this.category = 'Tools'
        this.description =
            'A tool that uses the Browser-Use Cloud API to perform and poll for results of long-running web automation tasks.'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['browserUseApi']
        }
        this.inputs = [
            {
                label: 'LLM Model',
                name: 'llm_model',
                type: 'options',
                description: 'Select the AI model to power the browser agent. Smaller models are faster and cheaper.',
                default: 'llama-4-maverick-17b-128e-instruct',
                options: [
                    { label: 'gpt-4o', name: 'gpt-4o' },
                    { label: 'gpt-4o-mini', name: 'gpt-4o-mini' },
                    { label: 'gpt-4.1', name: 'gpt-4.1' },
                    { label: 'gpt-4.1-mini', name: 'gpt-4.1-mini' },
                    { label: 'gemini-2.0-flash', name: 'gemini-2.0-flash' },
                    { label: 'gemini-2.0-flash-lite', name: 'gemini-2.0-flash-lite' },
                    { label: 'gemini-2.5-flash-preview-04-17', name: 'gemini-2.5-flash-preview-04-17' },
                    { label: 'claude-3-7-sonnet-20250219', name: 'claude-3-7-sonnet-20250219' },
                    { label: 'claude-sonnet-4-20250514', name: 'claude-sonnet-4-20250514' },
                    { label: 'llama-4-maverick-17b-128e-instruct', name: 'llama-4-maverick-17b-128e-instruct' }
                ],
                additionalParams: true
            },
            {
                label: 'Max Agent Steps',
                name: 'max_agent_steps',
                type: 'number',
                description: 'The maximum number of interaction steps the agent can take to complete the task. Default: 25.',
                default: 25,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Polling Timeout (s)',
                name: 'pollingTimeoutS',
                type: 'number',
                description: 'Maximum time in seconds to wait for the task to complete. Default: 180.',
                default: 180,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Polling Interval (s)',
                name: 'pollingIntervalS',
                type: 'number',
                description: 'Time in seconds between each check for task completion. Default: 2.',
                default: 2,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Session Options',
                name: 'sessionOptions',
                type: 'json',
                description:
                    'Optional browser session configuration, as a JSON object (e.g., {"use_proxy": true, "accept_cookies": true}).',
                placeholder: `{"use_proxy": true}`,
                optional: true,
                additionalParams: true
            }
        ]
        this.baseClasses = [this.type, ...getBaseClasses(BrowserUseTool)]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiKey = getCredentialParam('apiKey', credentialData, nodeData)

        if (!apiKey) {
            throw new Error('Browser-Use API key not specified!')
        }

        const llmModel = nodeData.inputs?.llm_model as string | undefined
        const maxAgentSteps = nodeData.inputs?.max_agent_steps as number | undefined
        const pollingTimeoutS = nodeData.inputs?.pollingTimeoutS as number | undefined
        const pollingIntervalS = nodeData.inputs?.pollingIntervalS as number | undefined
        const sessionOptionsStr = nodeData.inputs?.sessionOptions as string

        let sessionOptions: object | undefined
        if (sessionOptionsStr) {
            try {
                sessionOptions = JSON.parse(sessionOptionsStr)
            } catch (e) {
                throw new Error('Invalid JSON in Session Options field.')
            }
        }

        const toolOptions = {
            llmModel: llmModel,
            maxAgentSteps: maxAgentSteps,
            sessionOptions: sessionOptions,
            pollingIntervalMs: pollingIntervalS ? pollingIntervalS * 1000 : undefined,
            pollingTimeoutMs: pollingTimeoutS ? pollingTimeoutS * 1000 : undefined
        }

        const tool = new BrowserUseTool(apiKey, toolOptions)

        return tool
    }
}

module.exports = { nodeClass: BrowserUse_Tools }
