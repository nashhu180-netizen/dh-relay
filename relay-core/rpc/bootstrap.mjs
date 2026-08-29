import { bindOwnedEndpoint } from './transport.mjs';
import { loadAjv, validateOne } from '../tools/validate.mjs';

/**
 * Fixed, non-JSON-RPC negotiation endpoint. It publishes only the schema-bound
 * v2 descriptor and closes each connection after the single exchange.
 */
export function createBootstrapServer({ endpoint, descriptor }) {
  const { ajv, byId } = loadAjv();
  return bindOwnedEndpoint(endpoint, {
    createConnectionHandlers() {
      let answered = false;
      return {
        onFrame(frame, conn) {
          if (answered) return conn.destroy();
          answered = true;
          const request = validateOne(ajv, byId, 'relay.rpc-bootstrap/v1', frame);
          const response = validateOne(ajv, byId, 'relay.rpc-descriptor/v2', descriptor);
          if (!request.ok || frame.protocol !== 'relay.rpc-bootstrap/v1' || !response.ok) return conn.destroy();
          conn.send(descriptor);
          conn.close();
        },
        onFrameError(unused, conn) { conn.destroy(); },
      };
    },
  });
}
