import {
  AuthWorkflowEvents,
  generateJwtToken,
  MedusaError,
} from "@medusajs/utils";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/workflows-sdk";
import { emitEventStep, useRemoteQueryStep } from "../../common";

export const generateResetPasswordTokenWorkflow = createWorkflow(
  "generate-reset-password-token",
  (input: { entityId: string; provider: string }) => {
    const providerIdentities = useRemoteQueryStep({
      entry_point: "provider_identity",
      fields: ["auth_identity_id", "provider_metadata"],
      variables: {
        filters: {
          entity_id: input.entityId,
          provider: input.provider,
        },
      },
    })

    const token = transform(
      { input, providerIdentities },
      ({ input, providerIdentities }) => {
        const providerIdentity = providerIdentities?.[0]

        if (!providerIdentity) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Provider identity with entity_id ${input.entityId} and provider ${input.provider} not found`
          )
        }

        const token = generateJwtToken(
          {
            entity_id: input.entityId,
            provider: input.provider,
          },
          {
            // Ensures the token can only be used once per requested reset
            secret: providerIdentity.provider_metadata.password,
            expiresIn: "15m",
          }
        )

        return token
      }
    )

    emitEventStep({
      eventName: AuthWorkflowEvents.PASSWORD_RESET,
      data: { entity_id: input.entityId, token },
    })

    return new WorkflowResponse(token)
  }
)
