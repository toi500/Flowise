import { INodeParams, INodeCredential } from '../src/Interface'

class BrowserUseApi implements INodeCredential {
    label: string
    name: string
    version: number
    inputs: INodeParams[]

    constructor() {
        this.label = 'Browser-Use API'
        this.name = 'browserUseApi'
        this.version = 1.0
        this.inputs = [
            {
                label: 'Browser-Use API Key',
                name: 'apiKey',
                type: 'password',
                description: 'Get your API key from the browser-use.com dashboard.'
            }
        ]
    }
}

module.exports = { credClass: BrowserUseApi }
