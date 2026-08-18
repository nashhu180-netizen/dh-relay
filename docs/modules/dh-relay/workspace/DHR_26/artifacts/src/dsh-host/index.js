import { Service } from '@deepseek-ai/cordis'
import { createRelayPilotService } from './service-factory.js'

export const name = 'relay-pilot-host'
export const RelayPilotService = createRelayPilotService(Service)
export default RelayPilotService
